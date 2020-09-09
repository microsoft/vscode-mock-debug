/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { MockDebugSession } from './mockDebug';

import { readFileSync } from 'fs';
import * as Net from 'net';
import { FileAccessor } from './mockRuntime';

/*
 * Since the debug adapter runs as an external process, it has no access to VS Code API.
 */
const fsAccessor:  FileAccessor = {
	async readFile(path: string): Promise<string> {
		const buffer = readFileSync(path);
		return buffer.toString();
	}
};

/*
 * When the debug adapter is run as an external process,
 * the helper function DebugSession.run(...) takes care of everything.
 */
// MockDebugSession.run(MockDebugSession);

// ... but the helper is not flexible enough to deal with constructors with parameters.
// So for now we use a modified copy of the helper:

// parse arguments
let port = 0;
const args = process.argv.slice(2);
args.forEach(function (val, index, array) {
	const portMatch = /^--server=(\d{4,5})$/.exec(val);
	if (portMatch) {
		port = parseInt(portMatch[1], 10);
	}
});

if (port > 0) {
	// start as a server
	console.error(`waiting for debug protocol on port ${port}`);
	Net.createServer((socket) => {
		console.error('>> accepted connection from client');
		socket.on('end', () => {
			console.error('>> client connection closed\n');
		});
		const session = new MockDebugSession(fsAccessor);
		session.setRunAsServer(true);
		session.start(socket, socket);
	}).listen(port);
} else {

	// start a session
	const session = new MockDebugSession(fsAccessor);
	process.on('SIGTERM', () => {
		session.shutdown();
	});
	session.start(process.stdin, process.stdout);
}
