import 'dotenv/config';
import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import { LocalClient } from '../src/local-client';
import { logger } from '../src/helpers/logger';

const { CLIENT_WS_URL = '', STUB_ID = '', STUB_URL = '' } = process.env;

export async function runLocalClient() {
  const localClient = new LocalClient({
    wsUrl: CLIENT_WS_URL,
    stubId: STUB_ID,
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

  await localClient.run();
  return localClient;
}

export async function sendStubRequest(body: string) {
  logger.info(`Sending request to stub: ${body}`);
  const res = await fetch(STUB_URL, { method: 'POST', body });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}
