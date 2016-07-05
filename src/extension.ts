/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.getProgramName', () => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a text file in the workspace folder",
			value: "readme.md"
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
}
