/// <reference types="node" />
/// <reference types="node" />
/**
 * WebSocket client wrapper.
 */
import http from 'node:http';
import WebSocket from 'ws';
import { Message } from './protocol';
type WaitFn = (message: Message) => unknown;
type WaitFnData = {
    resolve: (v: Message) => unknown;
    reject: (e: Error) => unknown;
};
export declare class WsClient {
    protected wsUrl: string;
    ws: WebSocket;
    connectionId: string;
    onJsonMessage?: (message: Message) => unknown;
    protected waitFns: Map<WaitFn, WaitFnData>;
    constructor(wsUrl: string);
    ensureConnected(): Promise<void>;
    sendJson(message: Message): Promise<void>;
    clearListeners(): void;
    waitMessage(fn: WaitFn): Promise<Message>;
    close(): Promise<void>;
    protected onMessage(message: WebSocket.RawData): void;
    protected onUpgrade(req: http.IncomingMessage): void;
    protected onClose(code: number, reason: Buffer): void;
}
export {};
//# sourceMappingURL=ws-client.d.ts.map