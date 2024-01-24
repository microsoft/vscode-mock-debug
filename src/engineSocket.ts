import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface IEngineVariableData
{    
    name: string;
    type: string;
    value: any;
}

export interface IEngineStackFrame
{
    file: string;
    line: number;
    column: number;
    predicate: string;
    repetition: number;
    variables: Array<IEngineVariableData>;
}

export interface IEngineStopData
{
    stack: Array<IEngineStackFrame>;
    stopName: string;
}

export class EngineSocket extends EventEmitter {
    private _ws: WebSocket;
    private _started = false;
    private _saveEmit: {event: string, arg: any}[] = [];

    public constructor(ws: WebSocket) {
        super();
        this._ws = ws;
        ws.on('message', (bytesArray: ArrayBuffer) => {
            const decoder: TextDecoder = new TextDecoder('utf-8');
            var jsonString = decoder.decode(bytesArray);
            if (jsonString === 'ping')
            {
                this._ws.send('pong');
            }
            else
            {
                const jsonObject: IEngineStopData = JSON.parse(jsonString);
                this.safeEmit('stop', jsonObject);
            }
        });
        ws.on('close', () => {
            this.safeEmit('close', 0);
        });
    }

    private safeEmit(event: string, arg: any) {
        if (this._started) {
            this.emit(event, arg);
        } else {
            this._saveEmit.push({event, arg});
        }
    }

    public start() {
        this._started = true;
        for (const {event, arg} of this._saveEmit) {
            this.emit(event, arg);
        }
        this._saveEmit = [];
    }

    public async sendCommand(name: string): Promise<void> {
        await this._ws.send(name);
    }

    public sendCommandData(name: string, jsonObject: any) {
        jsonObject.message = name;
        this._ws.send(JSON.stringify(jsonObject));
    }

    public close() {
        this._ws.close();
    }
}