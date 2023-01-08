/**
 * WebSocket client wrapper.
 */
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
  protected waitFns = new Map<WaitFn, WaitFnData>();

  constructor(protected wsUrl: string, protected topic = 'default') {}

  async ensureConnected() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info(`WS connection already opened`);
      return;
    }
    await new Promise(resolve => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
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
  }

  protected onClose(code: number, reason: Buffer) {
    logger.info(`WS connection closed`);
    // todo: remove listeners
  }
}
