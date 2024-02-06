/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * extension.ts (and activateMockDebug.ts) forms the "plugin" that plugs into VS Code and contains the code that
 * connects VS Code with the debug adapter.
 * 
 * extension.ts contains code for launching the debug adapter
 * 
 */

'use strict';

import * as vscode from 'vscode';
import { activateDebug } from './activateDebug';

export function activate(context: vscode.ExtensionContext) {
	// run the debug adapter inside the extension and directly talk to it
	activateDebug(context);
}

export function deactivate() {
	// nothing to do
}
