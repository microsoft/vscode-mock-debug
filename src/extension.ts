/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';

var ps = require('ps-node');

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.pickProcess', () => {

		ps.lookup({
			psargs: 'ax'
		}, (err, resultList) => {

			let items = [];

			if (err) {
				items.push(err.message);
			} else {
				resultList.forEach( process => {
					if (process) {
						items.push(`${process.pid}: ${process.command} ${process.arguments}`);
					}
				});
			}

			vscode.window.showQuickPick(items);
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
}
