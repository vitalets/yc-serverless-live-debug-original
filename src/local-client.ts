/**
 * Local WebSocket client that receives request, runs local code
 * and sends result back to stub function.
 */

import { WsRequest, WsResponse } from './helpers/ws-protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';
import { sendToConnection } from './helpers/ws-apigw-grpc';
import { CloudHandler } from './helpers/cloud-request';

export type stubId = string;

export type LocalClientOptions = {
  wsUrl: string,
  functions: Record<stubId, CloudHandler>,
}

export class LocalClient {
  wsClient: WsClient;

  constructor(protected options: LocalClientOptions) {
    const stubIds = Object.keys(options.functions).join(',');
    this.wsClient = new WsClient(options.wsUrl, {
      'X-Stub-Id': stubIds,
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
    logger.info(`Waiting requests from stubs...`);
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
      const handler = this.options.functions[request.stubId];
      if (!handler) throw new Error(`Unknown stubId: ${request.stubId}`);
      // @ts-expect-error to keep things simple
      return await handler(event, context) as WsResponse['payload'];
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
    const method = 'httpMethod' in event ? event.httpMethod : '';
    // @ts-expect-error url not in types
    const url = event.url;
    logger.info(`---`);
    logger.info(`${method} ${url}`);
  }
}
