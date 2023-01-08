/**
 * Bridge function accepts WebSocket connections and proxy messages
 * from stub to local and back.
 */

import { Handler } from '@yandex-cloud/function-types';
import { sendToConnection } from './helpers/ws-apigw';
import { AckMessage, ClientRegister, ClientResponse, Message, StubRequest } from './helpers/protocol';
import { Ydb } from './helpers/ydb';
import { logger } from './helpers/logger';

type HttpEvent = Parameters<Handler.Http>[0];
type Context = Parameters<Handler.Http>[1];
type WsReq = {
  connectionId: string,
  eventType: string,
  token: string,
  event: HttpEvent,
}

export const handler: Handler.Http = async (event, context) => {
  logger.info(`Got event: ${JSON.stringify(event)}`);
  const wsReq = getWsReq(event, context);
  const response = wsReq.connectionId
    ? await handleWsReq(wsReq)
    : await handleHttpReq(context);
  logger.info(`Got response: ${JSON.stringify(response)}`);
  return response;
}

async function handleWsReq(wsReq: WsReq) {
  if (wsReq.eventType === 'MESSAGE') {
    const message = JSON.parse(wsReq.event.body) as Message;
    return handleWsMessage(wsReq, message);
  }
  throw new Error(`Unsupported ws event ${wsReq.eventType}`);
}

async function handleWsMessage(wsReq: WsReq, message: Message) {
  logger.info(message.type, JSON.stringify(message));
  try {
    switch (message.type) {
      case 'stub.request': return await handleStubRequest(wsReq, message);
      case 'client.register': return await handleClientRegister(wsReq, message);
      case 'client.response': return await handleClientResponse(wsReq, message);
      default: throw new Error(`Unsupported message type: ${message.type}`);
    }
  } catch (e) {
    logger.error(e.stack, `BODY: ${wsReq.event.body}`);
    return buildWsErrorResponse(e, message);
  }
}

async function handleClientRegister(wsReq: WsReq, { stubId, reqId }: ClientRegister) {
  await new Ydb(wsReq.token).saveConnectionId(stubId, wsReq.connectionId);
  return buildFnResponse(<AckMessage>{
    type: 'ack',
    stubId,
    reqId,
  });
}

async function handleStubRequest(wsReq: WsReq, message: StubRequest) {
  const clientConnectionId = await new Ydb(wsReq.token).getConnectionId(message.stubId);
  if (!clientConnectionId) {
    throw new Error(`No local client connections for stub: ${message.stubId}`);
  }
  message.replyTo = wsReq.connectionId;
  try {
    await sendToConnection(clientConnectionId, message, wsReq.token);
  } catch (e) {
    // todo: use error.code
    if (e.message.includes(`connection with id ${clientConnectionId} not found`)) {
      throw new Error(`Please run client on localhost.`);
    } else {
      throw e;
    }
  }

  // todo: handle staled client connection
  return buildFnResponse();
}

async function handleClientResponse(wsReq: WsReq, message: ClientResponse) {
  await sendToConnection(message.replyTo, message, wsReq.token);
  // todo: handle staled stub connection
  return buildFnResponse();
}

async function handleHttpReq(context: Context) {
  try {
    const token = context.token?.access_token || '';
    const connections = await new Ydb(token).getConnections();
    return buildFnResponse(
      `Live debug bridge is running. Local connections: ${connections.length}`
    );
  } catch (e) {
    logger.error(e.stack);
    return buildHttpErrorResponse(e);
  }
}

function getWsReq(event: HttpEvent, context: Context): WsReq {
  // @ts-expect-error see https://github.com/yandex-cloud/function-ts-types/issues/8
  const { connectionId = '', eventType } = event.requestContext;
  return {
    connectionId,
    eventType,
    token: context.token?.access_token || '',
    event,
  };
}

function buildWsErrorResponse(e: Error, { stubId, reqId }: Message) {
  return buildFnResponse(<AckMessage>{
    type: 'ack',
    stubId,
    reqId,
    error: {
      code: 'error', // todo
      message: e.message,
    }
  });
}

function buildHttpErrorResponse(e: Error) {
  return {
    statusCode: 500,
    body: e.stack,
  };
}

function buildFnResponse(data?: unknown) {
  const body = data === undefined || typeof data === 'string'
   ? data
   : JSON.stringify(data);
  return {
    statusCode: 200,
    body,
  };
}
