import { EventEmitter } from 'events';
import { EngineSocket, IEngineStopData } from './engineSocket';

export interface IRuntimeBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

interface IRuntimeStackFrame {
	id: number;
	name: string;
	file: string;
	line: number;
	column?: number;
}

export interface IRuntimeStack {
	count: number;
	frames: IRuntimeStackFrame[];
}

interface RuntimeDisassembledInstruction {
	address: number;
	instruction: string;
	line?: number;
}

interface IRuntimeThread {
	id: number;
	name: string;
}

export type IRuntimeVariableType = number | boolean | string | RuntimeVariable[];

export class RuntimeVariable {
	public get value() {
		return this._value;
	}

	public get type() {
		return this._type;
	}

	public get isReadOnly() {
		return this.name !== '$writeLog';
	}

	public set value(value: IRuntimeVariableType) {
		if (this._session.onVariableValueChanging(this.name, value)) {
			this._value = value;
			this._type = typeof value;
		}
	}

	constructor(private _session: RuntimeSession, public readonly name: string, private _value: IRuntimeVariableType, private _type: string) {}
}

export function timeout(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class RuntimeSession extends EventEmitter {

	// the initial (and one and only) file we are 'debugging'
	private _waitFile: string = '';
	private _initialData?: object = undefined;
	private _breakPoints = new Map<string, IRuntimeBreakpoint[]>();
	private _breakPointId = 1;
	private _stackId = 1;
	private _threadID = 1; // only 1
	private _engine: EngineSocket | null = null;
	private _stacks: Map<number, IRuntimeStackFrame[]> = new Map<number, IRuntimeStackFrame[]>();
	private _variables: Map<number, Map<string, RuntimeVariable>> = new Map<number, Map<string, RuntimeVariable>>();

	public setEngine(engine: EngineSocket) {
		this._engine = engine;
		engine.on('stop', (data: IEngineStopData) =>
		{
			const newStack: IRuntimeStackFrame[] = [];
			data.stack.forEach(s => {
				var stack = {
					id: this._stackId++,
					name: s.repetition > 1 ? `${s.predicate} (${s.repetition})` : s.predicate,
					file: s.file,
					line: s.line,
					column: s.column
				};
				var variables = new Map<string, RuntimeVariable>();
				s.variables.forEach(v => {
					var name = v.name;
					if (name.startsWith('VSD')) {
						name = name.replace('VSD', '$');
					}
					variables.set(name, new RuntimeVariable(this, name, v.value, v.type));
				});
				this._variables.set(stack.id, variables);
				newStack.push(stack);
			});

			var threadId = this._threadID;
			this._stacks.set(threadId, newStack);

			//this.sendEvent('stopOnException', data.variables["$exception"]);
			this.sendEvent(data.stopName, threadId);
		});
		engine.on('close', () => {
			this._engine = null;
			this.sendEvent('end');
		});
		this.startEngine();
	}

	private startEngine() {
		if (this._initialData) {
			this._engine?.sendCommandData('initialData', {
				...this._initialData,
				breakpoints: Array.from(this._breakPoints, ([name, value]) => ({ path: name, lines: value }))
			});
			this._engine?.start();
		}
	}

	public start(program: string, stopOnEntry: boolean, writeLog: boolean, logFile: string) {
		this._waitFile = program;
		this._initialData = { stopOnEntry, writeLog, logFile };
		//this.sendEvent('stopOnEntry'); // show waitFile (not working)
		this.startEngine();
	}

	public async end(): Promise<void> {
		await this._engine?.sendCommand('finish');
	}
	
	public pause(threadId: number) {
		this._engine?.sendCommand('pause');
	}

	public restart(): void {
		this._engine?.sendCommand('dumpDb');
	}

	public continue(threadId: number, reverse: boolean) {
		if (reverse) {
			this._engine?.sendCommand('continueBack');
		} else {
			this._engine?.sendCommand('continue');
		}
	}

	public step(threadId: number, reverse: boolean) {
		this._engine?.sendCommand(reverse ? 'stepBack' : 'step');
	}

	public stepIn(threadId: number) {
		this._engine?.sendCommand('stepIn');
	}

	public stepOut(threadId: number) {
		this._engine?.sendCommand('stepOut');
	}

	/*
	 * Determine possible column breakpoint positions for the given line.
	 */
	public getBreakpoints(path: string, line: number): number[] {
		return [];
	}

	/*
	 * Set breakpoint in file with given line.
	 */
	public async setBreakPoint(path: string, line: number): Promise<IRuntimeBreakpoint> {
		path = this.normalizePathAndCasing(path);
		const bp: IRuntimeBreakpoint = { verified: true, line, id: this._breakPointId++ };
		let bps = this._breakPoints.get(path);
		if (!bps) {
			bps = new Array<IRuntimeBreakpoint>();
			this._breakPoints.set(path, bps);
		}
		bps.push(bp);
		
		this._engine?.sendCommandData('setBreakPoint', { path, line });
		return { id: 0, line, verified: true };
	}

	/*
	 * Clear breakpoint in file with given line.
	 */
	public clearBreakPoint(path: string, line: number): IRuntimeBreakpoint | undefined {
		path = this.normalizePathAndCasing(path);
		const bps = this._breakPoints.get(path);
		if (bps) {
			const index = bps.findIndex(bp => bp.line === line);
			if (index >= 0) {
				const bp = bps[index];
				bps.splice(index, 1);
				return bp;
			}
		}

		this._engine?.sendCommandData('clearBreakPoint', { path, line });
		return undefined;
	}

	public clearBreakpoints(path: string): void {
		this._breakPoints.delete(this.normalizePathAndCasing(path));
		this._engine?.sendCommandData('clearBreakPoints', { path });
	}

	public setDataBreakpoint(address: string, accessType: 'read' | 'write' | 'readWrite'): boolean {
		return true;
	}

	public clearAllDataBreakpoints(): void {
	}

	public async getGlobalVariables(cancellationToken?: () => boolean ): Promise<RuntimeVariable[]> {
		return [];
	}

	public getLocalVariables(frameId: number): RuntimeVariable[] {
		var vars = this._variables.get(frameId);
		if (!vars) { return [];}
		return Array.from(vars, ([name, value]) => value);
	}

	public getLocalVariable(frameId: number, name: string): RuntimeVariable | undefined {
		var vars = this._variables.get(frameId);
		if (!vars) { return undefined;}
		return vars.get(name);
	}

	public evaluate(expression: string, frameId?: number): RuntimeVariable | undefined {
		if (!frameId) { return undefined; }
		return this.getLocalVariable(frameId, expression);
	}

	public onVariableValueChanging(name: string, value: IRuntimeVariableType): boolean {
		if (name === '$writeLog' && (value === true || value === false)) {
			this._engine?.sendCommandData('setVariable', { name, value });
			return true;
		}
		return false;
	}

	/**
	 * Return words of the given address range as "instructions"
	 */
	public disassemble(address: number, instructionCount: number): RuntimeDisassembledInstruction[] {
		return [];
	}

	private sendEvent(event: string, ... args: any[]): void {
		setTimeout(() => {
			this.emit(event, ...args);
		}, 0);
	}

	private normalizePathAndCasing(path: string) {
		if (process.platform === 'win32') {
			return path.replace(/\//g, '\\').toLowerCase();
		} else {
			return path.replace(/\\/g, '/');
		}
	}

	public getThreads(): IRuntimeThread[] {
		return [
			{
				id: 1,
				name: this._engine === null ? 'waiting' : 'Prolog'
			}
		];
	}

	public getStack(threadId: number, startFrame: number, endFrame: number): IRuntimeStack {
		let stack = this._stacks.get(threadId);
		if (!stack) {
			stack = [{
				id: 1,
				name: 'waiting',
				file: this._waitFile,
				line: 1,
			}];
		}
		return {
			frames: stack.slice(startFrame, endFrame),
			count: stack.length
		};
	}
}
