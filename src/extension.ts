/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import {
	DebugConfigurationProvider, DebugConfiguration,
	WorkspaceFolder, CancellationToken, ProviderResult, ExtensionContext
} from 'vscode';


export function activate(context: ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.mock-debug.getProgramName', config => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a markdown file in the workspace folder",
			value: "readme.md"
		});
	}));

	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('mock', new MockDebugConfigurationProvider()));
}

export function deactivate() {
	// nothing to do
}

class MockDebugConfigurationProvider implements DebugConfigurationProvider {

	provideDebugConfigurations?(folder: WorkspaceFolder | undefined, token?: CancellationToken): ProviderResult<DebugConfiguration[]> {

		return [
			{
				type: 'mock',
				request: 'launch',
				name: 'Mock Debug',
				program: '${workspaceRoot}/readme.md',
				stopOnEntry: true
			},
			{
				type: 'mock',
				request: 'launch',
				name: 'Ask for file name',
				program: '${workspaceRoot}/${command:AskForProgramName}',
				stopOnEntry: true
			}
		];
	}

	resolveDebugConfiguration?(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {

		// make sure that all mandatory attributes have a value
		config.type = config.type || 'mock';
		config.request = config.request || 'launch';
		config.name = config.name || 'Mock Debug';

		// by default stop on entry
		if (typeof config.stopOnEntry !== 'boolean') {
			config.stopOnEntry = true;
		}

		if (!config.program) {
			// try to use editor
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'markdown') {
				config.program = editor.document.fileName;
			}
		}

		if (!config.program) {
			// still no program? ask for it!
			config.program = '${workspaceRoot}/${command:AskForProgramName}';
		}

		return config;
	}
}
