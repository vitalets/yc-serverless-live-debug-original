import 'dotenv/config';
import assert from 'node:assert/strict';
import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import { LocalClient } from '../src/client';
import { logger } from '../src/helpers/logger';

const { CLIENT_WS_URL = '', STUB_ID = '', STUB_URL = '' } = process.env;

describe('live debug', () => {
  let client: LocalClient;

  before(async () => {
    client = await runClient();
  });

  after(async () => {
    await client?.close();
  });

  it('should proxy requests to local code', async () => {
    const response = await sendStubRequest('foo');
    assert.equal(response, 'Response from local: foo');

    const response2 = await sendStubRequest('bar');
    assert.equal(response2, 'Response from local: bar');
  });
});

describe('live debug (no client)', () => {
  it('should throw error if no client connected', async () => {
    const promise = sendStubRequest('foo');
    await assert.rejects(promise, /No clients connected/);
  });
});

async function runClient() {
  const client = new LocalClient({
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

  await client.run();
  return client;
}

async function sendStubRequest(body: string) {
  logger.info(`Sending request to stub: ${body}`);
  const res = await fetch(STUB_URL, { method: 'POST', body });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}
