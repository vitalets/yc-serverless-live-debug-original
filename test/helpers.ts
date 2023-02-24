import 'dotenv/config';
import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import { LocalClient, LocalClientOptions } from '../src/local-client';
import { logger } from '../src/helpers/logger';

const { CLIENT_WS_URL = '', STUB_URL = '' } = process.env;

export function createEchoHandler(name: string): Handler.Http {
  return async event => {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return {
      statusCode: 200,
      body: `Response from ${name}: ${body}`
    };
  };
}

export async function runLocalClient(functions: LocalClientOptions['functions']) {
  const localClient = new LocalClient({
    wsUrl: CLIENT_WS_URL,
    functions,
  });

  await localClient.run();
  return localClient;
}

export async function sendStubRequest(body: string, stubId?: string) {
  logger.info(`Sending request to stub: ${body}`);
  const headers: HeadersInit = stubId ? { 'X-Stub-Id': stubId } : {};
  const res = await fetch(STUB_URL, { method: 'POST', body, headers });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}
