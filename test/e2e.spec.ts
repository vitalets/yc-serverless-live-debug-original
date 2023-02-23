import assert from 'node:assert/strict';
import { LocalClient } from '../src/local-client';
import { runLocalClient, sendStubRequest } from './helpers';

describe('live debug', () => {
  let localClient: LocalClient;

  before(async () => {
    localClient = await runLocalClient();
  });

  after(async () => {
    await localClient?.close();
  });

  it('should send requests to local code and back', async () => {
    const response = await sendStubRequest('foo');
    assert.equal(response, 'Response from local: foo');

    const response2 = await sendStubRequest('bar');
    assert.equal(response2, 'Response from local: bar');
  });
});

describe('live debug (no clients)', () => {
  it('should throw error if no client connected', async () => {
    const promise = sendStubRequest('foo');
    await assert.rejects(promise, /No clients connected/);
  });
});

