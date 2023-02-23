/**
 * Local WebSocket client that receives request, runs local code
 * and sends result back to stub function.
 */

import { WsRequest, WsResponse } from './helpers/ws-protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';
import { sendToConnection } from './helpers/ws-apigw';
import { HttpEvent } from './helpers/cloud-request';

export type LocalClientOptions = {
  wsUrl: string,
  /** Unique id of stub function. Allows to route multiple stubs/clients via single ydb */
  stubId: string,
  handler: Function, // eslint-disable-line @typescript-eslint/ban-types
}

export class LocalClient {
  wsClient: WsClient;

  constructor(protected options: LocalClientOptions) {
    this.wsClient = new WsClient(options.wsUrl, {
      'X-Stub-Id': options.stubId,
    });
  }

  async run() {
    await this.ensureConnected();
    this.waitRequests();
  }

  async close() {
    await this.wsClient.close();
  }

  protected async ensureConnected() {
    await this.wsClient.ensureConnected();
    logger.info('Local client connected');
  }

  protected waitRequests() {
    logger.info(`Waiting requests from stub...`);
    this.wsClient.onJsonMessage = async message => {
      if (message.type !== 'request') return;
      this.logRequestInfo(message);
      const responsePayload = await this.getResponsePayload(message);
      await this.sendResponse(message, responsePayload);
    };
  }

  protected async getResponsePayload(request: WsRequest) {
    try {
      const { event, context } = request.payload;
      logger.info(`Waiting response from local code...`);
      const payload = await this.options.handler(event, context);
      return payload as WsResponse['payload'];
    } catch (e) {
      logger.error(e);
      return {
        statusCode: 500,
        body: e.stack,
      };
    }
  }

  protected async sendResponse(message: WsRequest, payload: WsResponse['payload']) {
    const response: WsResponse = {
      type: 'response',
      reqId: message.reqId,
      payload,
    };
    await sendToConnection(message.stubConnectionId, response, message.token);
    logger.info('Response sent.');
  }

  protected logRequestInfo(message: WsRequest) {
    const { event } = message.payload;
    const method = (event as HttpEvent).httpMethod;
    // @ts-expect-error url not in types
    const url = event.url;
    logger.info(`---`);
    logger.info(`${method} ${url}`);
  }
}
