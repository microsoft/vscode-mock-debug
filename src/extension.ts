/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';
import { basename } from 'path';

interface ProcessItem extends vscode.QuickPickItem {
	pid: string;	// payload for the QuickPick UI
}

function listProcesses() : Promise<ProcessItem[]> {

	return new Promise((resolve, reject) => {

		if (process.platform === 'win32') {

			const CMD_PID = new RegExp('^(.+) ([0-9]+)$');
			const EXECUTABLE_ARGS = new RegExp('^(?:"([^"]+)"|([^ ]+))(?: (.+))?$');

			let stdout = '';
			let stderr = '';

			const cmd = spawn('cmd');

			cmd.stdout.on('data', data => {
				stdout += data.toString();
			});
			cmd.stderr.on('data', data => {
				stderr += data.toString();
			});

			cmd.on('exit', () => {

				if (stderr.length > 0) {
					reject(stderr);
				} else {
					const items : ProcessItem[]= [];

					const lines = stdout.split('\r\n');
					for (const line of lines) {
						const matches = CMD_PID.exec(line.trim());
						if (matches && matches.length === 3) {

							const cmd = matches[1].trim();
							const pid = matches[2];

							let executable;
							let args;
							const matches2 = EXECUTABLE_ARGS.exec(cmd);
							if (matches2 && matches2.length >= 2) {
								if (matches2.length >= 3) {
									executable = matches2[1] || matches2[2];
								} else {
									executable = matches2[1];
								}
								if (matches2.length === 4) {
									args = matches2[3];
								}
							}

							if (executable) {
								items.push({
									label: basename(executable),
									description: pid,
									detail: cmd,
									pid: pid
								});
							}
						}
					};

					resolve(items);
				}
			});

			cmd.stdin.write('wmic process get ProcessId,CommandLine \n');
			cmd.stdin.end();

		} else {	// OS X & Linux

			const PID_CMD = new RegExp('^\\s*([0-9]+)\\s+(.+)$');

			const args = '-ax -o pid=,args=';

			exec('ps ' + args, (err, stdout, stderr) => {

				if (err || stderr) {
					reject(err || stderr.toString());
				} else {
					const items : ProcessItem[]= [];

					const lines = stdout.toString().split('\n');
					for (const line of lines) {

						const matches = PID_CMD.exec(line);
						if (matches && matches.length === 3) {

							const pid = matches[1];
							const cmd = matches[2];

							let executable = cmd;
							const parts = cmd.split(' ');
							if (parts.length >= 1) {
								executable = basename(parts[0]);
							}

							items.push({
								label: executable,
								description: pid,
								detail: cmd,
								pid: pid
							});
						}
					}

					resolve(items);
				}
			});
		}
	});
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.pickProcess', () => {

		return listProcesses().then(items => {

			let options : vscode.QuickPickOptions = {
				placeHolder: "Pick the process to attach to",
				matchOnDescription: true,
				matchOnDetail: true
			};

			return vscode.window.showQuickPick(items, options).then(item => {
				return item ? item.pid : null;
			});
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
}
