/**
 * Bridge function accepts WebSocket connections and proxy messages
 * from stub to local and back.
 */

import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import Context from '@yandex-cloud/function-types/dist/src/context.js';
import { AckMessage, LocalRegister, LocalResponse, Message, StubRequest } from './helpers/protocol.js';
import * as ydb from './helpers/ydb.js';

type HttpEvent = Parameters<Handler.Http>[0];
type WsReq = {
  connectionId: string,
  eventType: string,
  token: string,
  event: HttpEvent,
}

export const handler: Handler.Http = async (event, context) => {
  const wsReq = getWsReq(event, context);
  return wsReq.connectionId ? handleWs(wsReq) : handleHttp(context);
}

async function handleWs(wsReq: WsReq) {
  if (wsReq.eventType !== 'MESSAGE') {
    throw new Error(`Unsupported ws event ${wsReq.eventType}`);
  }
  const message = JSON.parse(wsReq.event.body) as Message;
  try {
    switch (message.type) {
      case 'local.register': return await handleLocalRegister(wsReq, message);
      case 'stub.request': return await handleStubRequest(wsReq, message);
      case 'local.response': return await handleLocalResponse(wsReq, message);
      default: throw new Error(`Unsupported message type: ${message.type}`);
    }
  } catch (e) {
    return buildWsErrorResponse(e, message);
  }
}

async function handleLocalRegister(wsReq: WsReq, { topic, reqId }: LocalRegister) {
  await ydb.saveConnectionId(topic, wsReq.connectionId, wsReq.token);
  return buildFnResponse(<AckMessage>{
    type: 'ack',
    topic,
    reqId,
  });
}

async function handleStubRequest(wsReq: WsReq, message: StubRequest) {
  const localConnectionId = await ydb.getConnectionId(message.topic, wsReq.token);
  if (!localConnectionId) {
    throw new Error(`No local connection for topic: ${message.topic}`);
  }
  message.replyTo = wsReq.connectionId;
  await sendToConnection(localConnectionId, message, wsReq.token);
  return buildFnResponse();
}

async function handleLocalResponse(wsReq: WsReq, message: LocalResponse) {
  await sendToConnection(message.replyTo, message, wsReq.token);
  return buildFnResponse();
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

/**
 * Send message to WS connection.
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 */
async function sendToConnection(connectionId: string, message: Message, token: string) {
  const method = 'POST';
  const url = `https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/${connectionId}/:send`;
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const messageStr = JSON.stringify(message);
  const body = JSON.stringify({
    type: 'TEXT',
    data: Buffer.from(messageStr, 'utf8').toString('base64'),
  });
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw new Error(await res.text());
}

async function handleHttp(context: Context) {
  try {
    const connections = await ydb.getConnections(context.token?.access_token || '')
    return buildFnResponse(
      `Live debug bridge is running. Local connections: ${connections}`
    );
  } catch (e) {
    return buildHttpErrorResponse(e);
  }
}

function buildWsErrorResponse(e: Error, { topic, reqId }: Message) {
  return buildFnResponse(<AckMessage>{
    type: 'ack',
    topic,
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
