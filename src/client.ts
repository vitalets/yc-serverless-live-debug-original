/**
 * Local client that receives WebSocket message, runs local code
 * and sends result back to stub function.
 */

import { ClientRegister, ClientResponse, StubRequest } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';
import { sendToConnection } from './helpers/ws-apigw';

export type LocalClientOptions = {
  wsUrl: string,
  stubId: string,
  handler: Function,
}

export class LocalClient {
  wsClient: WsClient;

  constructor(protected options: LocalClientOptions) {
    this.wsClient = new WsClient(options.wsUrl);
  }

  async run() {
    await this.wsClient.ensureConnected();
    await this.register();
    this.waitRequests();
  }

  close() {
    this.wsClient.ws.close();
  }

  protected async ensureConnected() {
    await this.wsClient.ensureConnected();
    logger.info('Local client connected');
  }

  protected async register() {
    logger.info('Registering local client...');
    const message: ClientRegister = {
      type: 'client.register',
      wsUrl: this.wsClient.ws.url,
      stubId: this.options.stubId,
      reqId: Date.now().toString(),
    };
    this.wsClient.sendJson(message);
    await this.wsClient.waitMessage(m => m.reqId === message.reqId);
    logger.info('Local client registered');
  }

  protected waitRequests() {
    logger.info(`Waiting requests from stub...`);
    this.wsClient.onJsonMessage = async message => {
      if (message.type !== 'stub.request') return;
      logger.info(`Got request from stub: ${message.reqId}`);
      const responsePayload = await this.getResponsePayload(message);
      await this.sendResponse(message, responsePayload);
    };
  }

  protected async getResponsePayload(request: StubRequest) {
    try {
      const { event, context } = request.payload;
      logger.info(`Waiting response from local code...`);
      const payload = await this.options.handler(event, context);
      logger.info(`Got response from local code`);
      return payload as ClientResponse['payload'];
    } catch (e) {
      logger.error(e);
      return {
        statusCode: 500,
        body: e.stack,
      };
    }
  }

  protected async sendResponse(message: StubRequest, payload: ClientResponse['payload']) {
    const response: ClientResponse = {
      type: 'client.response',
      stubId: message.stubId,
      reqId: message.reqId,
      payload,
    };
    await sendToConnection(message.stubConnectionId, response, message.token);
    logger.info('Response sent');
  }
}
