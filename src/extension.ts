/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';

var cp = require('child_process');

class ProcessItem implements vscode.QuickPickItem {
	label: string;
	description: string;
	// detail: string;
	pid: string;
}

function listProcesses(args: string) : Promise<any[]> {

	return new Promise((resolve, reject) => {
		cp.exec('ps ' + args, function(err, stdout, stderr) {

			if (err || stderr) {
				reject( err || stderr.toString() );
			} else {

				const os = stdout.toString().split('\n');

				let items : ProcessItem[]= [];

				for (let i = 0; i < os.length; i++) {
					const o : string = os[i];

					const pos = o.indexOf(' ');
					if (pos > 0) {
						const pid = o.substr(0, pos);
						const cmd = o.substr(pos+1);

						items.push({ label: cmd, description: pid, pid: pid });
					}
				}

				resolve(items);
			}

		});
	});
}

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.pickProcess', () => {

		return listProcesses('-ax -c -o pid,command').then(items => {

			let options : vscode.QuickPickOptions = {
				placeHolder: "Pick the process to attach to",
				matchOnDescription: true,
				matchOnDetail: false
			};

			return vscode.window.showQuickPick(items, options).then(item => {
				if (item) {
					return item.pid;
				} else {
					return null;
				}
			});
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
}
