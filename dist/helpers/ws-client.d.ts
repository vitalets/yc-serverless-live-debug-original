/// <reference types="node" />
/// <reference types="node" />
/**
 * WebSocket client wrapper.
 */
import http from 'node:http';
import WebSocket from 'ws';
import { WsMessage } from './protocol';
type WaitFn = (message: WsMessage) => unknown;
type WaitFnData = {
    resolve: (v: WsMessage) => unknown;
    reject: (e: Error) => unknown;
};
export declare class WsClient {
    protected wsUrl: string;
    protected headers: Record<string, string>;
    ws: WebSocket;
    connectionId: string;
    onJsonMessage?: (message: WsMessage) => unknown;
    protected waitFns: Map<WaitFn, WaitFnData>;
    constructor(wsUrl: string, headers?: Record<string, string>);
    ensureConnected(): Promise<void>;
    sendJson(message: WsMessage): Promise<void>;
    clearListeners(): void;
    waitMessage(fn: WaitFn): Promise<WsMessage>;
    close(): Promise<void>;
    protected onMessage(message: WebSocket.RawData): void;
    protected onUpgrade(req: http.IncomingMessage): void;
    protected onClose(code: number, reason: Buffer): void;
}
export {};
//# sourceMappingURL=ws-client.d.ts.map