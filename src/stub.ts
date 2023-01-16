/**
 * Stub function proxies HTTP requests to local code via WebSocket.
 */
import { WsRequest } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';
import { Handler } from '@yandex-cloud/function-types';
import { Ydb } from './helpers/ydb';
import { ApigwError, sendToConnection } from './helpers/ws-apigw';
import { CloudRequest } from './helpers/cloud-request';

const { STUB_WS_URL = '' } = process.env;

// reuse ws client between calls
let wsClient: WsClient;

export const handler: Handler.Http = async (event, context) => {
  const req = new CloudRequest(event, context);
  const wsClient = getWsClient();
  try {
    const clientConnectionId = await getClientConnectionId(req);
    await wsClient.ensureConnected();
    await sendToLocalClient(clientConnectionId, req);
    const response = await waitResponse(wsClient, req.id);
    return response.payload;
  } catch (e) {
    logger.error(e.stack);
    return req.buildErrorResponse(e);
  } finally {
    wsClient.clearListeners();
  }
};

async function getClientConnectionId(req: CloudRequest) {
  const connection = await new Ydb(req.token).getConnection(req.functionId);
  if (!connection) throw new Error(`No client connections`);
  const { connectionId } =  connection;
  logger.info(`Client connection found: ${connectionId}`);
  return connectionId;
}

async function sendToLocalClient(clientConnectionId: string, req: CloudRequest) {
  logger.info(`Sending request to local client...`);
  const message: WsRequest = {
    type: 'request',
    stubId: req.functionId,
    reqId: req.id,
    stubConnectionId: wsClient.connectionId,
    token: req.token,
    payload: {
      event: req.event,
      context: req.context,
    },
  };
  try {
    await sendToConnection(clientConnectionId, message, req.token);
  } catch (e) {
    if (e instanceof ApigwError && e.code === 5) {
      throw new Error(`No clients connected.`);
    } else {
      throw e;
    }
  }
  return message;
}

async function waitResponse(wsClient: WsClient, reqId: string) {
  logger.info(`Waiting response...`);
  const message = await wsClient.waitMessage(m => m.reqId === reqId);
  logger.info(`Got response: ${JSON.stringify(message)}`);
  if (message.type === 'response') return message;
  throw new Error(`Invalid response type: ${message.type}`);
}

function getWsClient() {
  wsClient = wsClient || new WsClient(STUB_WS_URL);
  // todo: check disconnected
  return wsClient;
}
