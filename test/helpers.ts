import fs from 'node:fs';
import fetch from 'node-fetch';
import { Handler } from '@yandex-cloud/function-types';
import { logger } from '../src/helpers/logger';
import { LiveDebugStackOutputs } from '../src/client/cdktf/main';

export function readOutputs(file: string) {
  const outputs = JSON.parse(fs.readFileSync(file, 'utf8'));
  return outputs['live-debug'] as LiveDebugStackOutputs;
}

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

export async function sendStubRequest(url: string, body: string) {
  logger.info(`Sending stub request: ${body}`);
  const res = await fetch(url, { method: 'POST', body });
  const text = await res.text();
  logger.info(`Got response from stub: ${res.status} ${text}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${text}`);
  return text;
}
