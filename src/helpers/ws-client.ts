/**
 * WebSocket client wrapper.
 */
import http from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { Message } from './protocol';
import { logger } from './logger';

type WaitFn = (message: Message) => unknown;
type WaitFnData = {
  resolve: (v: Message) => unknown,
  reject: (e: Error) => unknown,
};

export class WsClient {
  ws!: WebSocket;
  connectionId = '';
  onJsonMessage?: (message: Message) => unknown;

  protected waitFns = new Map<WaitFn, WaitFnData>();

  constructor(protected wsUrl: string) {}

  async ensureConnected() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info(`WS connection already open`);
      return;
    }
    await new Promise(resolve => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('upgrade', req => this.onUpgrade(req));
      this.ws.on('message', message => this.onMessage(message));
      this.ws.on('close', (code, reason) => this.onClose(code, reason));
      // todo: connection error
      // todo: timeout
    });
    logger.info(`WS connection opened`);
  }

  async sendJson(message: Message) {
    const strMessage = JSON.stringify(message);
    logger.debug(`WS ->: ${strMessage}`);
    this.ws?.send(strMessage);
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

  async close() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      await once(this.ws, 'close');
    }
  }

  protected onMessage(message: WebSocket.RawData) {
    logger.debug(`WS <-: ${message}`);
    const jsonMessage = JSON.parse(message.toString()) as Message;
    this.waitFns.forEach(({ resolve, reject }, fn) => {
      if (!fn(jsonMessage)) return;
      if (jsonMessage.type === 'ack' && jsonMessage.error) {
        reject(new Error(jsonMessage.error.message));
      } else {
        resolve(jsonMessage);
      }
    });
    this.onJsonMessage?.(jsonMessage);
  }

  protected onUpgrade(req: http.IncomingMessage) {
    this.connectionId = <string>req.headers['x-yc-apigateway-websocket-connection-id'];
  }

  protected onClose(code: number, reason: Buffer) {
    logger.info(`WS connection closed: ${code} ${reason}`);
    // todo: remove listeners
  }
}
