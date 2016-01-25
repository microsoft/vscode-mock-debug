/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

"use strict";

import cp = require('child_process');
import assert = require('assert');
import net = require('net');
import {DebugProtocol} from 'vscode-debugprotocol';
import {ProtocolClient} from './ProtocolClient';


export class DebugClient extends ProtocolClient {

	private _runtime: string;
	private _executable: string;
	private _adapterProcess: cp.ChildProcess;
	private _enableStderr: boolean;
	private _debugType: string;
	private _socket: net.Socket;

	private _supportsConfigurationDoneRequest: boolean;

	/**
	 * Creates a DebugClient object that provides a promise-based API to write
	 * debug adapter tests.
	 * A simple mocha example for setting and hitting a breakpoint in line 15 of a program 'test.js' looks like this:
	 *
	 * var dc;
	 * setup(done => {
	 *     dc = new DebugClient('node', './out/node/nodeDebug.js', 'node');
	 *     dc.start(done);
	 * });
	 * teardown(done => {
	 *     dc.stop(done);
	 * });
	 * test('should stop on a breakpoint', () => {
	 *     return dc.hitBreakpoint({ program: "test.js" }, "test.js", 15);
	 * });
	 */
	constructor(runtime: string, executable: string, debugType: string) {
		super();
		this._runtime = runtime;
		this._executable = executable;
		this._enableStderr = false;
		this._debugType = debugType;
		this._supportsConfigurationDoneRequest = false;
	}

	// ---- life cycle --------------------------------------------------------------------------------------------------------

	/**
	 * Starts a new debug adapter and sets up communication via stdin/stdout.
	 * If a port number is specified the adapter is not launched but a connection to
	 * a debug adapter running in server mode is established. This is useful for debugging
	 * the adapter while running tests. For this reason all timeouts are disabled in server mode.
	 */
	public start(done, port?: number) {

		if (typeof port === "number") {
			this._socket = net.createConnection(port, '127.0.0.1', () => {
				this.connect(this._socket, this._socket);
				done();
			});
		} else {
			this._adapterProcess = cp.spawn(this._runtime, [ this._executable ], {
					stdio: [
						'pipe', 	// stdin
						'pipe', 	// stdout
						'pipe'	// stderr
					],
				}
			);
			const sanitize = (s: string) => s.toString().replace(/\r?\n$/mg, '');
			this._adapterProcess.stderr.on('data', (data: string) => {
				if (this._enableStderr) {
					console.log(sanitize(data));
				}
			});

			this._adapterProcess.on('error', (err) => {
				console.log(err);
			});
			this._adapterProcess.on('exit', (code: number, signal: string) => {
				// console.log('exit');
				if (code) {
					// throw new Error("debug adapter exit code: " + code);
					done(new Error("debug adapter exit code: " + code));
				}
			});

			this.connect(this._adapterProcess.stdout, this._adapterProcess.stdin);
			done();
		}
	}

	/**
	 * Shutdown the debug adapter (or disconnect if in server mode).
	 */
	public stop(done) {

		if (this._adapterProcess) {
			this._adapterProcess.kill();
			this._adapterProcess = null;
		}
		if (this._socket) {
			this._socket.end();
			this._socket = null;
		}
		done();
	}

	// ---- protocol requests -------------------------------------------------------------------------------------------------

	public initializeRequest(args?: DebugProtocol.InitializeRequestArguments): Promise<DebugProtocol.InitializeResponse> {
		if (!args) {
			args = {
				adapterID: this._debugType,
				linesStartAt1: true,
				columnsStartAt1: true,
				pathFormat: 'path'
			}
		}
		return this.send('initialize', args);
	}

	public configurationDoneRequest(args?: DebugProtocol.ConfigurationDoneArguments): Promise<DebugProtocol.ConfigurationDoneResponse> {
		return this.send('configurationDone', args);
	}

	public launchRequest(args: DebugProtocol.LaunchRequestArguments): Promise<DebugProtocol.LaunchResponse> {
		return this.send('launch', args);
	}

	public attachRequest(args: DebugProtocol.AttachRequestArguments): Promise<DebugProtocol.AttachResponse> {
		return this.send('attach', args);
	}

	public disconnectRequest(args: DebugProtocol.DisconnectArguments): Promise<DebugProtocol.DisconnectResponse> {
		return this.send('disconnect', args);
	}

	public setBreakpointsRequest(args: DebugProtocol.SetBreakpointsArguments): Promise<DebugProtocol.SetBreakpointsResponse> {
		return this.send('setBreakpoints', args);
	}

	public setExceptionBreakpointsRequest(args: DebugProtocol.SetExceptionBreakpointsArguments): Promise<DebugProtocol.SetExceptionBreakpointsResponse> {
		return this.send('setExceptionBreakpoints', args);
	}

	public continueRequest(args: DebugProtocol.ContinueArguments): Promise<DebugProtocol.ContinueResponse> {
		return this.send('continue', args);
	}

	public nextRequest(args: DebugProtocol.NextArguments): Promise<DebugProtocol.NextResponse> {
		return this.send('next', args);
	}

	public stepInRequest(args: DebugProtocol.StepInArguments): Promise<DebugProtocol.StepInResponse> {
		return this.send('stepIn', args);
	}

	public stepOutRequest(args: DebugProtocol.StepOutArguments): Promise<DebugProtocol.StepOutResponse> {
		return this.send('stepOut', args);
	}

	public pauseRequest(args: DebugProtocol.PauseArguments): Promise<DebugProtocol.PauseResponse> {
		return this.send('pause', args);
	}

	public stacktraceRequest(args: DebugProtocol.StackTraceArguments): Promise<DebugProtocol.StackTraceResponse> {
		return this.send('stackTrace', args);
	}

	public scopesRequest(args: DebugProtocol.ScopesArguments): Promise<DebugProtocol.ScopesResponse> {
		return this.send('scopes', args);
	}

	public variablesRequest(args: DebugProtocol.VariablesArguments): Promise<DebugProtocol.VariablesResponse> {
		return this.send('variables', args);
	}

	public sourceRequest(args: DebugProtocol.SourceArguments): Promise<DebugProtocol.SourceResponse> {
		return this.send('source', args);
	}

	public threadsRequest(): Promise<DebugProtocol.ThreadsResponse> {
		return this.send('threads');
	}

	public evaluateRequest(args: DebugProtocol.EvaluateArguments): Promise<DebugProtocol.EvaluateResponse> {
		return this.send('evaluate', args);
	}

	// ---- convenience methods -----------------------------------------------------------------------------------------------

	/*
	 * Returns a promise that will resolve if an event with a specific type was received within the given timeout.
	 * The promise will be rejected if a timeout occurs.
	 */
	public waitForEvent(eventType: string, timeout: number = 3000): Promise<DebugProtocol.Event> {

		return new Promise((resolve, reject) => {
			this.on(eventType, event => {
				resolve(event);
			});
			if (!this._socket) {	// no timeouts if debugging the tests
				setTimeout(() => {
					reject(new Error(`no event '${eventType}' received after ${timeout} ms`));
				}, timeout);
			}
		})
	}

	/*
	 * Returns a promise that will resolve if an 'initialized' event was received within 3000ms
	 * and a subsequent 'configurationDone' request was successfully executed.
	 * The promise will be rejected if a timeout occurs or if the 'configurationDone' request fails.
	 */
	public configurationSequence(): Promise<any> {

		return this.waitForEvent('initialized').then(event => {
			if (this._supportsConfigurationDoneRequest) {
				return this.configurationDoneRequest();
			} else {
				// if debug adapter doesn't support the configurationDoneRequest we has to send the setExceptionBreakpointsRequest.
				return this.setExceptionBreakpointsRequest({ filters: [ 'all' ] });
			}
		});
	}

	/**
	 * Returns a promise that will resolve if a 'initialize' and a 'launch' request were successful.
	 */
	public launch(args: DebugProtocol.LaunchRequestArguments): Promise<DebugProtocol.LaunchResponse> {

		return this.initializeRequest().then(response => {
			if (response.body && response.body.supportsConfigurationDoneRequest) {
				this._supportsConfigurationDoneRequest = true;
			}
			return this.launchRequest(args);
		});
	}

	/*
	 * Returns a promise that will resolve if a 'stopped' event was received within 3000ms
	 * and the event's reason and line number was asserted.
	 * The promise will be rejected if a timeout occurs, the assertions fail, or if the 'stackTrace' request fails.
	 */
	public assertStoppedLocation(reason: string, line: number) : Promise<DebugProtocol.StackTraceResponse> {

		return this.waitForEvent('stopped').then(event => {
			assert.equal(event.body.reason, reason);
			return this.stacktraceRequest({
				threadId: event.body.threadId
			});
		}).then(response => {
			assert.equal(response.body.stackFrames[0].line, line);
			return response;
		});
	}

	// ---- scenarios ---------------------------------------------------------------------------------------------------------

	/**
	 * Returns a promise that will resolve if a configurable breakpoint has been hit within 3000ms
	 * and the event's reason and line number was asserted.
	 * The promise will be rejected if a timeout occurs, the assertions fail, or if the requests fails.
	 */
	public hitBreakpoint(launchArgs: any, program: string, line: number) : Promise<any> {

		return Promise.all([

			this.waitForEvent('initialized').then(event => {
				return this.setBreakpointsRequest({
					lines: [ line ],
					breakpoints: [ { line: line } ],
					source: { path: program }
				});
			}).then(response => {
				const bp = response.body.breakpoints[0];
				assert.equal(bp.verified, true);
				assert.equal(bp.line, line);
				if (this._supportsConfigurationDoneRequest) {
					return this.configurationDoneRequest();
				} else {
					// if debug adapter doesn't support the configurationDoneRequest we has to send the setExceptionBreakpointsRequest.
					return this.setExceptionBreakpointsRequest({ filters: [ 'all' ] });
				}
			}),

			this.launch(launchArgs),

			this.assertStoppedLocation('breakpoint', line)

		]);
	}
}
