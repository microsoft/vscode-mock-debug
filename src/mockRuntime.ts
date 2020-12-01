/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { EventEmitter } from 'events';

export interface FileAccessor {
	readFile(path: string): Promise<string>;
}

export interface IMockBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

interface IStepInTargets {
	id: number;
	label: string;
}

interface IStackFrame {
	index: number;
	name: string;
	file: string;
	line: number;
	column?: number;
}

interface IStack {
	count: number;
	frames: IStackFrame[];
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

	// the contents (= lines) of the one and only file
	private _sourceLines: string[] = [];

	// This is the next line that will be 'executed'
	private _currentLine = 0;
	private _currentColumn: number | undefined;

	// maps from sourceFile to array of Mock breakpoints
	private _breakPoints = new Map<string, IMockBreakpoint[]>();

	// since we want to send breakpoint events, we will assign an id to every event
	// so that the frontend can match events with breakpoints.
	private _breakpointId = 1;

	private _breakAddresses = new Set<string>();

	private _noDebug = false;

	private _namedException: string | undefined;
	private _otherExceptions = false;


	constructor(private _fileAccessor: FileAccessor) {
		super();
	}

	/**
	 * Start executing the given program.
	 */
	public async start(program: string, stopOnEntry: boolean, noDebug: boolean): Promise<void> {

		this._noDebug = noDebug;

		await this.loadSource(program);
		this._currentLine = -1;

		await this.verifyBreakpoints(this._sourceFile);

		if (stopOnEntry) {
			// we step once
			this.step(false, 'stopOnEntry');
		} else {
			// we just start to run until we hit a breakpoint or an exception
			this.continue();
		}
	}

	/**
	 * Continue execution to the end/beginning.
	 */
	public continue(reverse = false) {
		this.run(reverse, undefined);
	}

	/**
	 * Step to the next/previous non empty line.
	 */
	public step(reverse = false, event = 'stopOnStep') {
		this.run(reverse, event);
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

	public getStepInTargets(frameId: number): IStepInTargets[] {

		const line = this._sourceLines[this._currentLine].trim();

		// every word of the current line becomes a stack frame.
		const words = line.split(/\s+/);

		// return nothing if frameId is out of range
		if (frameId < 0 || frameId >= words.length) {
			return [];
		}

		// pick the frame for the given frameId
		const frame = words[frameId];

		const pos = line.indexOf(frame);

		// make every character of the frame a potential "step in" target
		return frame.split('').map((c, ix) => {
			return {
				id: pos + ix,
				label: `target: ${c}`
			};
		});
	}

	/**
	 * Returns a fake 'stacktrace' where every 'stackframe' is a word from the current line.
	 */
	public stack(startFrame: number, endFrame: number): IStack {

		const words = this._sourceLines[this._currentLine].trim().split(/\s+/);

		const frames = new Array<IStackFrame>();
		// every word of the current line becomes a stack frame.
		for (let i = startFrame; i < Math.min(endFrame, words.length); i++) {
			const name = words[i];	// use a word of the line as the stackframe name
			const stackFrame: IStackFrame = {
				index: i,
				name: `${name}(${i})`,
				file: this._sourceFile,
				line: this._currentLine
			};
			if (typeof this._currentColumn === 'number') {
				stackFrame.column = this._currentColumn;
			}
			frames.push(stackFrame);
		}
		return {
			frames: frames,
			count: words.length
		};
	}

	public getBreakpoints(path: string, line: number): number[] {

		const l = this._sourceLines[line];

		let sawSpace = true;
		const bps: number[] = [];
		for (let i = 0; i < l.length; i++) {
			if (l[i] !== ' ') {
				if (sawSpace) {
					bps.push(i);
					sawSpace = false;
				}
			} else {
				sawSpace = true;
			}
		}

		return bps;
	}

	/*
	 * Set breakpoint in file with given line.
	 */
	public async setBreakPoint(path: string, line: number): Promise<IMockBreakpoint> {

		const bp: IMockBreakpoint = { verified: false, line, id: this._breakpointId++ };
		let bps = this._breakPoints.get(path);
		if (!bps) {
			bps = new Array<IMockBreakpoint>();
			this._breakPoints.set(path, bps);
		}
		bps.push(bp);

		await this.verifyBreakpoints(path);

		return bp;
	}

	/*
	 * Clear breakpoint in file with given line.
	 */
	public clearBreakPoint(path: string, line: number): IMockBreakpoint | undefined {
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

	/*
	 * Clear all breakpoints for file.
	 */
	public clearBreakpoints(path: string): void {
		this._breakPoints.delete(path);
	}

	/*
	 * Set data breakpoint.
	 */
	public setDataBreakpoint(address: string): boolean {
		if (address) {
			this._breakAddresses.add(address);
			return true;
		}
		return false;
	}

	public setExceptionsFilters(namedException: string | undefined, otherExceptions: boolean): void {
		this._namedException = namedException;
		this._otherExceptions = otherExceptions;
	}

	/*
	 * Clear all data breakpoints.
	 */
	public clearAllDataBreakpoints(): void {
		this._breakAddresses.clear();
	}

	// private methods

	private async loadSource(file: string): Promise<void> {
		if (this._sourceFile !== file) {
			this._sourceFile = file;
			const contents = await this._fileAccessor.readFile(file);
			this._sourceLines = contents.split(/\r?\n/);
		}
	}

	/**
	 * Run through the file.
	 * If stepEvent is specified only run a single step and emit the stepEvent.
	 */
	private run(reverse = false, stepEvent?: string) {
		if (reverse) {
			for (let ln = this._currentLine-1; ln >= 0; ln--) {
				if (this.fireEventsForLine(ln, stepEvent)) {
					this._currentLine = ln;
					this._currentColumn = undefined;
					return;
				}
			}
			// no more lines: stop at first line
			this._currentLine = 0;
			this._currentColumn = undefined;
			this.sendEvent('stopOnEntry');
		} else {
			for (let ln = this._currentLine+1; ln < this._sourceLines.length; ln++) {
				if (this.fireEventsForLine(ln, stepEvent)) {
					this._currentLine = ln;
					this._currentColumn = undefined;
					return true;
				}
			}
			// no more lines: run to end
			this.sendEvent('end');
		}
	}

	private async verifyBreakpoints(path: string): Promise<void> {

		if (this._noDebug) {
			return;
		}

		const bps = this._breakPoints.get(path);
		if (bps) {
			await this.loadSource(path);
			bps.forEach(bp => {
				if (!bp.verified && bp.line < this._sourceLines.length) {
					const srcLine = this._sourceLines[bp.line].trim();

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

	/**
	 * Fire events if line has a breakpoint or the word 'exception' or 'exception(...)' is found.
	 * Returns true if execution needs to stop.
	 */
	private fireEventsForLine(ln: number, stepEvent?: string): boolean {

		if (this._noDebug) {
			return false;
		}

		const line = this._sourceLines[ln].trim();

		// if 'log(...)' found in source -> send argument to debug console
		const matches = /log\((.*)\)/.exec(line);
		if (matches && matches.length === 2) {
			this.sendEvent('output', matches[1], this._sourceFile, ln, matches.index);
		}

		// if a word in a line matches a data breakpoint, fire a 'dataBreakpoint' event
		const words = line.split(" ");
		for (const word of words) {
			if (this._breakAddresses.has(word)) {
				this.sendEvent('stopOnDataBreakpoint');
				return true;
			}
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

		// is there a breakpoint?
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
				return true;
			}
		}

		// non-empty line
		if (stepEvent && line.length > 0) {
			this.sendEvent(stepEvent);
			return true;
		}

		// nothing interesting found -> continue
		return false;
	}

	private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}
}