/*
 * Copyright (c) 2022 Arm Limited
 */

import * as vscode from 'vscode';
import { logger } from './logger';

export class DebugLogger {
    public constructor(protected debugTypes: string[]) {
    }

    public async activate(context: vscode.ExtensionContext): Promise<void> {
        const createDebugAdapterTracker = (session: vscode.DebugSession): vscode.DebugAdapterTracker => ({
            onWillStartSession: () => logger.debug(session.configuration),
            onWillReceiveMessage: message => logger.debug(`UI >>> Debugger\n${JSON.stringify(message)}`),
            onDidSendMessage: message => logger.debug(`UI <<< Debugger\n${JSON.stringify(message)}`)
        });

        const trackers = this.debugTypes.map(debugType => vscode.debug.registerDebugAdapterTrackerFactory(debugType, { createDebugAdapterTracker }));
        context.subscriptions.push(...trackers);
    }
}
