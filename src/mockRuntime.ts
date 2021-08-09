/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { EventEmitter } from 'events';

export interface FileAccessor {
	readFile(path: string): Promise<string>;
}

export interface IRuntimeBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

interface IRuntimeStepInTargets {
	id: number;
	label: string;
}

interface IRuntimeStackFrame {
	index: number;
	name: string;
	file: string;
	line: number;
	column?: number;
	instruction?: number;
}

interface IRuntimeStack {
	count: number;
	frames: IRuntimeStackFrame[];
}

interface RuntimeDisassembledInstruction {
	address: number;
	instruction: string;
}

export type IRuntimeVariableType = number | boolean | string | IRuntimeVariable[];

export interface IRuntimeVariable {
	name: string;
	value: IRuntimeVariableType;
}

interface Word {
	name: string;
	index: number
}

export function timeout(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A Mock runtime with minimal debugger functionality.
 */
export class MockRuntime extends EventEmitter {

	// the initial (and one and only) file we are 'debugging'
	private _sourceFile: string = '';
	public get sourceFile() {
		return this._sourceFile;
	}

	private _variables = new Map<string, IRuntimeVariable>();

	// the contents (= lines) of the one and only file
	private _sourceLines: string[] = [];
	private _instructions: Word[] = [];
	private _starts: number[] = [];
	private _ends: number[] = [];

	// This is the next line that will be 'executed'
	private __currentLine = 0;
	private get _currentLine() {
		return this.__currentLine;
	}
	private set _currentLine(x) {
		this.__currentLine = x;
		this._instruction = this._starts[x];
	}
	private _currentColumn: number | undefined;

	// This is the next instruction that will be 'executed'
	public _instruction= 0;

	// maps from sourceFile to array of IRuntimeBreakpoint
	private _breakPoints = new Map<string, IRuntimeBreakpoint[]>();

	// all instruction breakpoint addresses
	private _instructionBreakpoints = new Set<number>();

	// since we want to send breakpoint events, we will assign an id to every event
	// so that the frontend can match events with breakpoints.
	private _breakpointId = 1;

	private _breakAddresses = new Map<string, string>();

	public debug;

	private _namedException: string | undefined;
	private _otherExceptions = false;


	constructor(private _fileAccessor: FileAccessor) {
		super();
	}

	/**
	 * Start executing the given program.
	 */
	public async start(program: string, stopOnEntry: boolean): Promise<void> {

		await this.loadSource(program);

		await this.verifyBreakpoints(this._sourceFile);

		if (this.debug && stopOnEntry) {
			this.findNextStatement(false, 'stopOnEntry');
		} else {
			// we just start to run until we hit a breakpoint or an exception
			this.continue(false);
		}
	}

	/**
	 * Continue execution to the end/beginning.
	 */
	public continue(reverse: boolean) {

		while (!this.executeLine(this._currentLine, reverse)) {
			if (this.updateCurrentLine(reverse)) {
				break;
			}
			if (this.findNextStatement(reverse)) {
				break;
			}
		}
	}

	/**
	 * Step to the next/previous non empty line.
	 */
	public step(instruction: boolean, reverse: boolean) {

		if (instruction) {
			if (reverse) {
				this._instruction--;
			} else {
				this._instruction++;
			}
			this.sendEvent('stopOnStep');
		} else {
			if (!this.executeLine(this._currentLine, reverse)) {
				if (!this.updateCurrentLine(reverse)) {
					this.findNextStatement(reverse, 'stopOnStep');
				}
			}
		}
	}

	private updateCurrentLine(reverse: boolean): boolean {
		if (reverse) {
			if (this._currentLine > 0) {
				this._currentLine--;
			} else {
				// no more lines: stop at first line
				this._currentLine = 0;
				this._currentColumn = undefined;
				this.sendEvent('stopOnEntry');
				return true;
			}
		} else {
			if (this._currentLine < this._sourceLines.length-1) {
				this._currentLine++;
			} else {
				// no more lines: run to end
				this._currentColumn = undefined;
				this.sendEvent('end');
				return true;
			}
		}
		return false;
	}

	/**
	 * "Step into" for Mock debug means: go to next character
	 */
	public stepIn(targetId: number | undefined) {
		if (typeof targetId === 'number') {
			this._currentColumn = targetId;
			this.sendEvent('stopOnStep');
		} else {
			if (typeof this._currentColumn === 'number') {
				if (this._currentColumn <= this._sourceLines[this._currentLine].length) {
					this._currentColumn += 1;
				}
			} else {
				this._currentColumn = 1;
			}
			this.sendEvent('stopOnStep');
		}
	}

	/**
	 * "Step out" for Mock debug means: go to previous character
	 */
	public stepOut() {
		if (typeof this._currentColumn === 'number') {
			this._currentColumn -= 1;
			if (this._currentColumn === 0) {
				this._currentColumn = undefined;
			}
		}
		this.sendEvent('stopOnStep');
	}

	public getStepInTargets(frameId: number): IRuntimeStepInTargets[] {

		const line = this.getLine();
		const words = this.getWords(line);

		// return nothing if frameId is out of range
		if (frameId < 0 || frameId >= words.length) {
			return [];
		}

		const { name, index  }  = words[frameId];

		// make every character of the frame a potential "step in" target
		return name.split('').map((c, ix) => {
			return {
				id: index + ix,
				label: `target: ${c}`
			};
		});
	}

	/**
	 * Returns a fake 'stacktrace' where every 'stackframe' is a word from the current line.
	 */
	public stack(startFrame: number, endFrame: number): IRuntimeStack {

		const line = this.getLine();
		const words = this.getWords(line);
		words.push({ name: 'BOTTOM', index: -1 });	// add a sentinel so that the stack is never empty...

		// if the line contains the word 'disassembly' we support to "disassemble" the line by adding an 'instruction' property to the stackframe
		const instruction = line.indexOf('disassembly') >= 0 ? this._instruction : undefined;

		const column = typeof this._currentColumn === 'number' ? this._currentColumn : undefined;

		const frames: IRuntimeStackFrame[] = [];
		// every word of the current line becomes a stack frame.
		for (let i = startFrame; i < Math.min(endFrame, words.length); i++) {

			const stackFrame: IRuntimeStackFrame = {
				index: i,
				name: `${words[i].name}(${i})`,	// use a word of the line as the stackframe name
				file: this._sourceFile,
				line: this._currentLine,
				column: column, // words[i].index
				instruction: instruction
			};

			frames.push(stackFrame);
		}

		return {
			frames: frames,
			count: words.length
		};
	}

	/*
	 * Determine possible column breakpoint positions for the given line.
	 * Here we return the start location of words with more than 8 characters.
	 */
	public getBreakpoints(path: string, line: number): number[] {
		return this.getWords(this.getLine(line)).filter(w => w.name.length > 8).map(w => w.index);
	}

	/*
	 * Set breakpoint in file with given line.
	 */
	public async setBreakPoint(path: string, line: number): Promise<IRuntimeBreakpoint> {

		const bp: IRuntimeBreakpoint = { verified: false, line, id: this._breakpointId++ };
		let bps = this._breakPoints.get(path);
		if (!bps) {
			bps = new Array<IRuntimeBreakpoint>();
			this._breakPoints.set(path, bps);
		}
		bps.push(bp);

		await this.verifyBreakpoints(path);

		return bp;
	}

	/*
	 * Clear breakpoint in file with given line.
	 */
	public clearBreakPoint(path: string, line: number): IRuntimeBreakpoint | undefined {
		const bps = this._breakPoints.get(path);
		if (bps) {
			const index = bps.findIndex(bp => bp.line === line);
			if (index >= 0) {
				const bp = bps[index];
				bps.splice(index, 1);
				return bp;
			}
		}
		return undefined;
	}

	public clearBreakpoints(path: string): void {
		this._breakPoints.delete(path);
	}

	public setDataBreakpoint(address: string, accessType: 'read' | 'write' | 'readWrite'): boolean {

		const x = accessType === 'readWrite' ? 'read write' : accessType;

		const t = this._breakAddresses.get(address);
		if (t) {
			if (t !== x) {
				this._breakAddresses.set(address, 'read write');
			}
		} else {
			this._breakAddresses.set(address, x);
		}
		return true;
	}

	public clearAllDataBreakpoints(): void {
		this._breakAddresses.clear();
	}
	
	public setExceptionsFilters(namedException: string | undefined, otherExceptions: boolean): void {
		this._namedException = namedException;
		this._otherExceptions = otherExceptions;
	}

	public setInstructionBreakpoint(address: number): boolean {
		this._instructionBreakpoints.add(address);
		return true;
	}

	public clearInstructionBreakpoints(): void {
		this._instructionBreakpoints.clear();
	}

	public async getGlobalVariables(cancellationToken?: () => boolean ): Promise<IRuntimeVariable[]> {

		let a: IRuntimeVariable[] = [];

		for (let i = 0; i < 10; i++) {
			a.push({
				name: `global_${i}`,
				value: i
			});
			if (cancellationToken && cancellationToken()) {
				break;
			}
			await timeout(1000);
		}

		return a;
	}

	public getLocalVariables(): IRuntimeVariable[] {
		return Array.from(this._variables, ([name, value]) => value);
	}

	public getLocalVariable(name: string): IRuntimeVariable | undefined {
		return this._variables.get(name);
	}

	/**
	 * Return words of the given address range as "instructions"
	 */
	public disassemble(address: number, instructionCount: number): RuntimeDisassembledInstruction[] {

		const instructions: RuntimeDisassembledInstruction[] = [];

		for (let a = address; a < address + instructionCount; a++) {
			instructions.push({
				address: a,
				instruction: (a >= 0 && a < this._instructions.length) ? this._instructions[a].name : 'nop'
			});
		}

		return instructions;
	}

	// private methods

	private getLine(line?: number): string {
		return this._sourceLines[line === undefined ? this._currentLine : line].trim();
	}

	private getWords(line: string): Word[] {
		// break line into words
		const WORD_REGEXP = /[a-z]+/ig;
		const words: Word[] = [];
		let match: RegExpExecArray | null;
		while (match = WORD_REGEXP.exec(line)) {
			words.push({ name: match[0], index: match.index });
		}
		return words;
	}

	private async loadSource(file: string): Promise<void> {
		if (this._sourceFile !== file) {
			this._sourceFile = file;
			const contents = await this._fileAccessor.readFile(file);
			this._sourceLines = contents.split(/\r?\n/);

			this._instructions = [];

			for (let line of this._sourceLines) {
				this._starts.push(this._instructions.length);
				const words = this.getWords(line);
				for (let word of words) {
					this._instructions.push(word);
				}
				this._ends.push(this._instructions.length);
			}

		}
	}

	/**
	 * return true on stop
	 */
	 private findNextStatement(reverse: boolean, stepEvent?: string): boolean {

		for (let ln = this._currentLine; reverse ? ln >= 0 : ln < this._sourceLines.length; reverse ? ln-- : ln++) {

			if (this.debug) {
				// is there a source breakpoint?
				const breakpoints = this._breakPoints.get(this._sourceFile);
				if (breakpoints) {
					const bps = breakpoints.filter(bp => bp.line === ln);
					if (bps.length > 0) {
	
						// send 'stopped' event
						this.sendEvent('stopOnBreakpoint');
	
						// the following shows the use of 'breakpoint' events to update properties of a breakpoint in the UI
						// if breakpoint is not yet verified, verify it now and send a 'breakpoint' update event
						if (!bps[0].verified) {
							bps[0].verified = true;
							this.sendEvent('breakpointValidated', bps[0]);
						}
	
						this._currentLine = ln;
						return true;
					}
				}
			}

			const line = this.getLine(ln);
			if (line.length > 0) {
				this._currentLine = ln;
				break;
			}
		}
		if (stepEvent) {
			this.sendEvent(stepEvent);
			return true;
		}
		return false;
	}

	/**
	 * "execute a line" of the readme markdown.
	 * Returns true if execution sent out a stopped event and needs to stop.
	 */
	private executeLine(ln: number, reverse: boolean): boolean {

		if (!this.debug) {
			return false;
		}

		// first "execute" the instructions associated with this line and potentially hit instruction breakpoints
		while (reverse ? this._instruction >= this._starts[ln] : this._instruction < this._ends[ln]) {
			reverse ? this._instruction-- : this._instruction++;
			if (this._instructionBreakpoints.has(this._instruction)) {
				this.sendEvent('stopOnInstructionBreakpoint');
				return true;
			}
		}

		const line = this.getLine(ln);

		// find variable accesses
		let reg0 = /\$([a-z][a-z0-9]*)(=(false|true|[0-9]+(\.[0-9]+)?|\".*\"|\{.*\}))?/ig;
		let matches0: RegExpExecArray | null;
		while (matches0 = reg0.exec(line)) {
			if (matches0.length === 5) {
				
				let access: string | undefined;

				const name = matches0[1];
				const value = matches0[3];

				let v: IRuntimeVariable = { name, value };

				if (value && value.length > 0) {
					if (value === 'true') {
						v.value = true;
					} else if (value === 'false') {
						v.value = false;
					} else if (value[0] === '"') {
						v.value = value.substr(1, value.length-2);
					} else if (value[0] === '{') {
						v.value = [ {
							name: 'fBool',
							value: true
						}, {
							name: 'fInteger',
							value: 123
						}, {
							name: 'fString',
							value: 'hello'
						} ];
					} else {
						v.value = parseFloat(value);
					}

					if (this._variables.has(name)) {
						// the first write access to a variable is the "declaration" and not a "write access"
						access = 'write';
					}
					this._variables.set(name, v);
				} else {
					if (this._variables.has(name)) {
						// variable must exist in order to trigger a read access 
						access = 'read';
					}
				}

				const accessType = this._breakAddresses.get(name);
				if (access && accessType && accessType.indexOf(access) >= 0) {
					this.sendEvent('stopOnDataBreakpoint', access);
					return true;
				}
			}
		}

		// if 'log(...)' found in source -> send argument to debug console
		const matches = /log\((.*)\)/.exec(line);
		if (matches && matches.length === 2) {
			this.sendEvent('output', matches[1], this._sourceFile, ln, matches.index);
		}

		// if pattern 'exception(...)' found in source -> throw named exception
		const matches2 = /exception\((.*)\)/.exec(line);
		if (matches2 && matches2.length === 2) {
			const exception = matches2[1].trim();
			if (this._namedException === exception) {
				this.sendEvent('stopOnException', exception);
				return true;
			} else {
				if (this._otherExceptions) {
					this.sendEvent('stopOnException', undefined);
					return true;
				}
			}
		} else {
			// if word 'exception' found in source -> throw exception
			if (line.indexOf('exception') >= 0) {
				if (this._otherExceptions) {
					this.sendEvent('stopOnException', undefined);
					return true;
				}
			}
		}

		// nothing interesting found -> continue
		return false;
	}

	private async verifyBreakpoints(path: string): Promise<void> {

		if (this.debug) {
			const bps = this._breakPoints.get(path);
			if (bps) {
				await this.loadSource(path);
				bps.forEach(bp => {
					if (!bp.verified && bp.line < this._sourceLines.length) {
						const srcLine = this.getLine(bp.line);
						
						// if a line is empty or starts with '+' we don't allow to set a breakpoint but move the breakpoint down
						if (srcLine.length === 0 || srcLine.indexOf('+') === 0) {
							bp.line++;
						}
						// if a line starts with '-' we don't allow to set a breakpoint but move the breakpoint up
						if (srcLine.indexOf('-') === 0) {
							bp.line--;
						}
						// don't set 'verified' to true if the line contains the word 'lazy'
						// in this case the breakpoint will be verified 'lazy' after hitting it once.
						if (srcLine.indexOf('lazy') < 0) {
							bp.verified = true;
							this.sendEvent('breakpointValidated', bp);
						}
					}
				});
			}
		}
	}
		
	private sendEvent(event: string, ... args: any[]): void {
		setImmediate(() => {
			this.emit(event, ...args);
		});
	}
}