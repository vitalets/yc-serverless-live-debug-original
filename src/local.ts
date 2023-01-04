/**
 * Local function receives WebSocket message, runs local code
 * and sends result back to WebSocket.
 */

import { LocalRegister, LocalResponse, Payload, StubRequest } from './helpers/protocol.js';
import { WsClient } from './helpers/ws.js';

const wsClient = new WsClient(process.env.WS_URL || '');
const functionId = process.env.DEBUG_FN_ID || '';

main();

async function main() {
  await wsClient.ensureConnected();
  await register();
  while (true) {
    const request = await waitRequest();
    const responsePayload = await getResponsePayload(request);
    sendResponse(request, responsePayload);
  }
}

async function waitRequest() {
  return wsClient.waitMessage(m => m.type === 'stub.request') as Promise<StubRequest>;
}

async function register() {
  const message: LocalRegister = {
    type: 'local.register',
    topic: functionId,
    reqId: Date.now().toString(),
  };
  wsClient.sendJson(message);
  await wsClient.waitMessage(m => m.reqId === message.reqId);
}

async function getResponsePayload(request: StubRequest) {
  try {
    const { event, context } = request.payload;
    return await handler(event, context);
  } catch (e) {
    return {
      statusCode: 500,
      body: e.stack,
    };
  }
}

async function sendResponse(request: StubRequest, payload: Payload) {
  const message: LocalResponse = {
    type: 'local.response',
    topic: request.topic,
    reqId: request.reqId,
    replyTo: request.replyTo,
    payload,
  };
  wsClient.sendJson(message);
}

async function handler(event: unknown, context: unknown) {
  return {
    statusCode: 200,
    body: `local handler`,
  };
}
