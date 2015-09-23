/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {DebugSession, InitializedEvent, TerminatedEvent, StoppedEvent, Thread, StackFrame, Scope, Source} from '../common/debugSession';
import {Handles} from '../common/Handles';
import {readFileSync} from 'fs';
import {basename} from 'path';


class MockDebugSession extends DebugSession {

	private static THREAD_ID = 1;

	private _sourceFile: string;
	private _currentLine: number;
	private _sourceLines: string[];
	private _breakPoints: any;
	private _variableHandles: Handles<string>;


	public constructor(debuggerLinesStartAt1: boolean, isServer: boolean = false) {
		super(debuggerLinesStartAt1, isServer);
		this._sourceFile = null;
		this._sourceLines = [];
		this._currentLine = 0;
		this._breakPoints = {};
		this._variableHandles = new Handles<string>();
	}

	protected initializeRequest(response: OpenDebugProtocol.InitializeResponse, args: OpenDebugProtocol.InitializeRequestArguments): void {
		this.sendResponse(response);

		// now we are ready to accept breakpoints -> fire the initialized event to give UI a chance to set breakpoints
		this.sendEvent(new InitializedEvent());
	}

	protected launchRequest(response: OpenDebugProtocol.LaunchResponse, args: OpenDebugProtocol.LaunchRequestArguments): void {
		this._sourceFile = args.program;
		this._sourceLines = readFileSync(this._sourceFile).toString().split('\n');

		if (args.stopOnEntry) {
			this._currentLine = 0;
			this.sendResponse(response);
			this.sendEvent(new StoppedEvent("entry", MockDebugSession.THREAD_ID));
		} else {
			this.continueRequest(response);
		}
	}

	protected setBreakPointsRequest(response: OpenDebugProtocol.SetBreakpointsResponse, args: OpenDebugProtocol.SetBreakpointsArguments): void {

		var path = args.source.path;
		var clientLines = args.lines;

		// read file contents into array for direct access
		var lines = readFileSync(path).toString().split('\n');

		var newPositions = [clientLines.length];
		var breakpoints = [];

		// verify breakpoint locations
		for (var i = 0; i < clientLines.length; i++) {
			var l = this.convertClientLineToDebugger(clientLines[i]);
			var verified = false;
			if (l < lines.length) {
				if (lines[l].indexOf("+") == 0)   // if lines start with '+' we move breakpoint down
					l++;
				if (lines[l].indexOf("-") == 0)   // if lines start with '-' we move breakpoint up
					l--;
				verified = true;    // all breakpoints with valid positions are verified
			}
			newPositions[i] = l;
			breakpoints.push({ verified: verified, line: this.convertDebuggerLineToClient(l)});
		}
		this._breakPoints[path] = newPositions;

		response.body = {
			breakpoints: breakpoints
		};
		this.sendResponse(response);
	}

	protected threadsRequest(response: OpenDebugProtocol.ThreadsResponse): void {

		response.body = {
			threads: [
				new Thread(MockDebugSession.THREAD_ID, "thread 1")
			]
		};
		this.sendResponse(response);
	}

	protected stackTraceRequest(response: OpenDebugProtocol.StackTraceResponse, args: OpenDebugProtocol.StackTraceArguments): void {

		var frames = new Array<StackFrame>();
		for (var i= 0; i < 3; i++) {
			frames.push(new StackFrame(i, "frame " + i, new Source(basename(this._sourceFile), this.convertDebuggerPathToClient(this._sourceFile)), this.convertDebuggerLineToClient(this._currentLine), 0));
		}
		response.body = {
			stackFrames: frames
		};
		this.sendResponse(response);
	}

	protected scopesRequest(response: OpenDebugProtocol.ScopesResponse, args: OpenDebugProtocol.ScopesArguments): void {

		const frameReference = args.frameId;
		var scopes = new Array<Scope>();
		scopes.push(new Scope("Local", this._variableHandles.create("local_" + frameReference), false));
		scopes.push(new Scope("Closure", this._variableHandles.create("closure_" + frameReference), false));
		scopes.push(new Scope("Global", this._variableHandles.create("global_" + frameReference), true));

		response.body = {
			scopes: scopes
		};
		this.sendResponse(response);
	}

	protected variablesRequest(response: OpenDebugProtocol.VariablesResponse, args: OpenDebugProtocol.VariablesArguments): void {

		var variables = [];
		var id = this._variableHandles.get(args.variablesReference);
		if (id != null) {
			variables.push({
				name: id + "_i",
				value: "123",
				variablesReference: 0
			});
			variables.push({
				name: id + "_f",
				value: "3.14",
				variablesReference: 0
			});
			variables.push({
				name: id + "_s",
				value: "hello world",
				variablesReference: 0
			});
			variables.push({
				name: id + "_o",
				value: "Object",
				variablesReference: this._variableHandles.create("object_")
			});
		}

		response.body = {
			variables: variables
		};
		this.sendResponse(response);
	}

	protected continueRequest(response: OpenDebugProtocol.ContinueResponse): void {

		var lines = this._breakPoints[this._sourceFile];
		for (var ln = this._currentLine+1; ln < this._sourceLines.length; ln++) {
			// is breakpoint on this line?
			if (lines && lines.indexOf(ln) >= 0) {
				this._currentLine = ln;
				this.sendResponse(response);
				this.sendEvent(new StoppedEvent("step", MockDebugSession.THREAD_ID));
				return;
			}
			// if word 'exception' found in source -> throw exception
			if (this._sourceLines[ln].indexOf("exception") >= 0) {
				this._currentLine = ln;
				this.sendResponse(response);
				this.sendEvent(new StoppedEvent("exception", MockDebugSession.THREAD_ID));
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: run to end
		this.sendEvent(new TerminatedEvent());
	}

	protected nextRequest(response: OpenDebugProtocol.NextResponse): void {
		
		for (var ln = this._currentLine+1; ln < this._sourceLines.length; ln++) {
			if (this._sourceLines[ln].trim().length > 0) {   // find next non-empty line
				this._currentLine = ln;
				this.sendResponse(response);
				this.sendEvent(new StoppedEvent("step", MockDebugSession.THREAD_ID));
				return;
			}
		}
		this.sendResponse(response);
		// no more lines: run to end
		this.sendEvent(new TerminatedEvent());
	}

	protected evaluateRequest(response: OpenDebugProtocol.EvaluateResponse, args: OpenDebugProtocol.EvaluateArguments): void {
		response.body = { result: "evaluate(" + args.expression + ")", variablesReference: 0 };
		this.sendResponse(response);
	}
}

DebugSession.run(MockDebugSession);
