/**
 * Local client that receives WebSocket message, runs local code
 * and sends result back to WebSocket.
 */

import { ClientRegister, ClientResponse, Payload, StubRequest } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';

export type LocalClientOptions = {
  bridgeWsUrl: string,
  stubId: string,
  handler: Function,
}

export class LocalClient {
  wsClient: WsClient;

  constructor(protected options: LocalClientOptions) {
    this.wsClient = new WsClient(options.bridgeWsUrl);
  }

  async run() {
    await this.wsClient.ensureConnected();
    await this.register();
    while (true) {
      // todo: subscribe instead of async loop
      const request = await this.waitRequest();
      const responsePayload = await this.getResponsePayload(request);
      this.sendResponse(request, responsePayload);
    }
  }

  close() {
    this.wsClient.ws.close();
  }

  protected async ensureConnected() {
    await this.wsClient.ensureConnected();
    logger.info('Local client connected');
  }

  protected async register() {
    const message: ClientRegister = {
      type: 'client.register',
      stubId: this.options.stubId,
      reqId: Date.now().toString(),
    };
    this.wsClient.sendJson(message);
    await this.wsClient.waitMessage(m => m.reqId === message.reqId);
    logger.info('Local client registered');
  }

  protected async waitRequest() {
    logger.info(`\nWaiting request from stub...`);
    const request = await this.wsClient.waitMessage(
      m => m.type === 'stub.request'
    ) as StubRequest;
    logger.info(`Got request from stub: ${request.reqId}`);
    return request;
  }

  protected async getResponsePayload(request: StubRequest) {
    try {
      const { event, context } = request.payload;
      logger.info(`Waiting response from local code...`);
      const payload = await this.options.handler(event, context);
      logger.info(`Got response from local code`);
      return payload;
    } catch (e) {
      logger.error(e);
      return {
        statusCode: 500,
        body: e.stack,
      };
    }
  }

  protected async sendResponse(request: StubRequest, payload: Payload) {
    const message: ClientResponse = {
      type: 'client.response',
      stubId: request.stubId,
      reqId: request.reqId,
      replyTo: request.replyTo,
      payload,
    };
    this.wsClient.sendJson(message);
    logger.info('Response sent');
  }
}
