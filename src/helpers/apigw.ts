/**
 * Send message to WS connection.
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 */

import fetch from 'node-fetch';
import { Message } from './protocol.js';

export async function sendToConnection(connectionId: string, message: Message, token: string) {
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
