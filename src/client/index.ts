/**
 * Local WebSocket client that receives request, runs local code
 * and sends result back to stub function.
 */

import { WsRequest, WsResponse } from '../helpers/ws-protocol';
import { WsClient } from '../helpers/ws-client';
import { logger } from '../helpers/logger';
import { sendToConnection } from '../helpers/ws-apigw-grpc';
import { CloudHandler } from '../helpers/cloud-request';

export { defineConfig } from './cli/config';

export type LocalClientOptions = {
  wsHost: string,
  stubId: string,
  handler: CloudHandler,
}

export async function runLocalClient(options: LocalClientOptions) {
  const localClient = new LocalClient(options);
  await localClient.run();
  return localClient;
}

export class LocalClient {
  wsClient: WsClient;

  constructor(protected options: LocalClientOptions) {
    this.wsClient = new WsClient(this.wsUrl, {
      'X-Live-Debug-Stub-Id': options.stubId,
    });
  }

  get wsUrl() {
    return `wss://${this.options.wsHost}/ws/client`;
  }

  get httpUrl() {
    return `https://${this.options.wsHost}`;
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
    logger.info(`Check url: ${this.httpUrl}`);
    logger.info(`Waiting requests...`);
    this.wsClient.onJsonMessage = async message => {
      if (message.type === 'request') {
        const responsePayload = await this.getResponsePayload(message);
        await this.sendResponse(message, responsePayload);
      } else {
        throw new Error(`Unknown ws message type: ${message.type}`);
      }
    };
  }

  protected async getResponsePayload(request: WsRequest) {
    try {
      const { event, context } = request.payload;
      // @ts-expect-error dont know how to fix this
      return await this.options.handler(event, context) as WsResponse['payload'];
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
    logger.info('Response sent');
  }
}
