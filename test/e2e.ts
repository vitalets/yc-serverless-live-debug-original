/**
 * End-to-end test of live debug.
 */

import 'dotenv/config';
import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import { LocalClient } from '../src/client';
import { logger } from '../src/helpers/logger';

test();

async function test() {
  const client = await runClient();

  const response = await sendStubRequest('foo');
  assert.equal(response, 'Response from local: foo');

  const response2 = await sendStubRequest('bar');
  assert.equal(response2, 'Response from local: bar');

  client.close();
  logger.info('OK');
}

async function runClient() {
  const client = new LocalClient({
    wsUrl: process.env.WS_URL || '',
    stubId: process.env.STUB_ID || '',
    handler: <Handler.Http>(async event => {
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      return {
        statusCode: 200,
        body: `Response from local: ${body}`
      };
    })
  });

  await client.run();
  return client;
}

async function sendStubRequest(body: string) {
  logger.info(`Sending request to stub: ${body}`);
  const res = await fetch(process.env.STUB_URL!, { method: 'POST', body });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}


// Error: {
//   "code": 4,
//   "message": "DeadlineExceeded"
// }


/*
Убеждлаемся, что connection живой:
CONN_ID=d202lri35t3sn3q66oj5u4k8bidif62bb; curl -X GET -H "Authorization: Bearer $(yc iam create-token)" \
    https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/$CONN_ID

Ответ:
{
  "identity": {
    "sourceIp": "51.250.53.27"
  },
  "id": "d202lri35t3sn3q66oj5u4k8bidif62bb",
  "gatewayId": "d5d4kk2bgiguaucuka0l",
  "connectedAt": "2023-01-05T10:32:44.827277557Z",
  "lastActiveAt": "2023-01-05T10:32:45.985541855Z"
}

Отправляем сообщение:
CONN_ID=d202lri35t3sn3q66oj5u4k8bidif62bb; curl -X POST -H "Authorization: Bearer $(yc iam create-token)" -d '{"type": "BINARY", "data": "foo"}' \
    https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/$CONN_ID/:send

Ответ:
{
 "code": 4,
 "message": "DeadlineExceeded"
}

*/


/*
  /ws:
    x-yc-apigateway-websocket-connect:
      parameters:
      - name: X-Yc-Apigateway-Websocket-Connection-Id
        in: header
        description: Websocket connection identifier
        required: true
        schema:
          type: string
      responses:
        '200':
          description: Connection identifier
          content:
            text/plain:
              schema:
                type: string
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          X-Yc-Apigateway-Websocket-Connection-Id: '{X-Yc-Apigateway-Websocket-Connection-Id}'
        content:
          text/plain: ''
          */
