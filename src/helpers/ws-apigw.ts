/**
 * Send message to WS connection on API gateway.
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 */

import fetch from 'node-fetch';
import { Message } from './protocol';
import { logger } from './logger';

const URL_TPL = `https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/{connectionId}/:send`;

export async function sendToConnection(connectionId: string, message: Message, token: string) {
  logger.info(`WS sending message to connection: ${connectionId}`);
  const method = 'POST';
  const url = URL_TPL.replace('{connectionId}', connectionId);
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const messageStr = JSON.stringify(message);
  const body = JSON.stringify({
    type: 'TEXT',
    data: Buffer.from(messageStr, 'utf8').toString('base64'),
  });
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) {
    const { message, code } = await res.json();
    throw new ApigwError(message, code);
  }
  logger.info(`WS message sent to connection: ${connectionId}`);
}

export class ApigwError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}
