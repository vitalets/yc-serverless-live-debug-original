/**
 * Stub function accepts requests and proxies them to local code via WebSocket.
 */
import { StubRequest } from './helpers/protocol.js';
import { WsClient } from './helpers/ws.js';

const wsClient = new WsClient(process.env.WS_URL || '');

// Universal definitions of cloud function params to cover all triggers
type FunctionEvent = Record<string, unknown>;
type FunctionContext = {
  requestId: string;
  functionName: string;
}

export const handler = async (event: FunctionEvent, context: FunctionContext) => {
  try {
    await wsClient.ensureConnected();
    const { reqId } = proxyRequest(event, context);
    const { payload } = await waitResponse(reqId);
    return payload;
  } catch (e) {
    return buildErrorResponse(e);
  } finally {
    wsClient.clearListeners();
  }
}

function proxyRequest(event: FunctionEvent, context: FunctionContext) {
  const message: StubRequest = {
    type: 'stub.request',
    topic: context.functionName,
    reqId: context.requestId,
    replyTo: '', // filled on bridge
    payload: { event, context },
  };
  wsClient.sendJson(message);
  return message;
}

async function waitResponse(reqId: string) {
  const message = await wsClient.waitMessage(m => m.reqId === reqId);
  if (message.type === 'local.response') return message;
  throw new Error(`Invalid response type: ${message.type}`);
}

function buildErrorResponse(e: Error) {
  return {
    statusCode: 500,
    body: e.stack,
  };
}

