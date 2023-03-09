/**
 * Copyright (C) 2022 Arm Limited
 */

import * as vscode from 'vscode';

export enum Verbosity {
    off = 0,
    error = 1,
    warn = 2,
    info = 3,
    debug = 4
}

export class Logger {
    public static instance = new Logger();

    protected outputChannel = vscode.window.createOutputChannel('Mock Debug');
    protected logVerbosity = Verbosity.debug;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public log(verbosity: Verbosity, message: string | any): void {
        if (this.logVerbosity === Verbosity.off) {
            return;
        }

        if (typeof message !== 'string') {
            message = JSON.stringify(message, undefined, '\t');
        }

        if (verbosity <= this.logVerbosity) {
            this.outputChannel.appendLine(message);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public error = (message: string | any): void => this.log(Verbosity.error, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public warn = (message: string | any): void => this.log(Verbosity.warn, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public info = (message: string | any): void => this.log(Verbosity.info, message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public debug = (message: string | any): void => this.log(Verbosity.debug, message);
}

export const logger = Logger.instance;
