/**
 * WebSocket client wrapper.
 */
import WebSocket from 'ws';
import { Message } from './protocol.js';

type WaitFn = (message: Message) => unknown;
type WaitFnData = {
  resolve: (v: Message) => unknown,
  reject: (e: Error) => unknown,
};

export class WsClient {
  ws!: WebSocket;
  protected waitFns = new Map<WaitFn, WaitFnData>();

  constructor(protected wsUrl: string, protected topic = 'default') {}

  async ensureConnected() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    return new Promise(resolve => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('message', message => this.onMessage(message));
      this.ws.on('close', (code, reason) => this.onClose(code, reason));
      // todo: connection error
      // todo: timeout
    });
  }

  async sendJson(message: Message) {
    this.ws?.send(JSON.stringify(message));
  }

  clearListeners() {
    this.waitFns.clear();
  }

  async waitMessage(fn: WaitFn) {
    // todo: timeout
    return new Promise<Message>((resolve, reject) => {
      this.waitFns.set(fn, { resolve, reject });
    });
  }

  protected onMessage(message: WebSocket.RawData) {
    if (typeof message !== 'string') return;
    const jsonMessage = JSON.parse(message) as Message;
    this.waitFns.forEach(({ resolve, reject }, fn) => {
      if (!fn(jsonMessage)) return;
      if (jsonMessage.type === 'ack' && jsonMessage.error) {
        reject(new Error(jsonMessage.error.message));
      } else {
        resolve(jsonMessage);
      }
    });
  }

  protected onClose(code: number, reason: Buffer) {
    // todo: remove listeners
  }
}
