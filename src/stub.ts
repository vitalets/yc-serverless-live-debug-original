/**
 * Stub function accepts requests and proxies them to local code via WebSocket.
 */
import { AckMessage, ClientRegister, Message, StubRequest } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
import { logger } from './helpers/logger';
import { Handler } from '@yandex-cloud/function-types';
import { Ydb } from './helpers/ydb';
import { ApigwError, sendToConnection } from './helpers/ws-apigw';
import { CloudRequest } from './helpers/cloud-request';

// reuse ws client between calls
let wsClient: WsClient;

export const handler: Handler.Http = async (event, context) => {
  const req = new CloudRequest(event, context);
  return handleClientRegister(req) || handleHttpRequest(req);
}

function handleClientRegister(req: CloudRequest) {
  if (req.isWebSocketRequest() && req.wsEventType === 'MESSAGE') {
    const message = JSON.parse(req.body) as Message;
    if (message.type === 'client.register') {
      return storeClientConnectionInfo(req, message);
    }
  }
}

async function handleHttpRequest(req: CloudRequest) {
  try {
    const { clientConnectionId, wsUrl } = await getClientConnection(req);
    const wsClient = getWsClient(wsUrl);
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
}

async function storeClientConnectionInfo(req: CloudRequest, msg: ClientRegister) {
  logger.info('client register', JSON.stringify(msg));
  const ackMessage: AckMessage = {
    type: 'ack',
    stubId: req.functionId,
    reqId: msg.reqId,
  };
  try {
    await new Ydb(req.token).saveConnection(req.functionId, req.wsConnectionId, msg.wsUrl);
    return req.buildResponse(ackMessage);
  } catch (e) {
    logger.error(e);
    ackMessage.error = {
      code: 'error',
      message: e.stack,
    };
    return req.buildResponse(ackMessage);
  }
}

async function getClientConnection(req: CloudRequest) {
  const connection = await new Ydb(req.token).getConnection(req.functionId);
  if (!connection) throw new Error(`No client connections`);
  return {
    clientConnectionId: connection.connectionId,
    wsUrl: connection.wsUrl,
  };
}

async function sendToLocalClient(clientConnectionId: string, req: CloudRequest) {
  logger.info(`Sending request to local client...`);
  const message: StubRequest = {
    type: 'stub.request',
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
      throw new Error(`No clients connected.`)
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
  if (message.type === 'client.response') return message;
  throw new Error(`Invalid response type: ${message.type}`);
}

function getWsClient(wsUrl: string) {
  wsClient = wsClient || new WsClient(wsUrl);
  return wsClient;
}
