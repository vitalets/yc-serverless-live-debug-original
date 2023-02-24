import assert from 'node:assert/strict';
import { LocalClient } from '../src/local-client';
import { createEchoHandler, runLocalClient, sendStubRequest } from './helpers';

const { STUB_ID = '' } = process.env;

describe('live debug (1 stub)', () => {
  let localClient: LocalClient;

  before(async () => {
    localClient = await runLocalClient({
      [STUB_ID]: createEchoHandler('local'),
    });
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

describe('live debug (2 stubs)', () => {
  let localClient: LocalClient;

  before(async () => {
    localClient = await runLocalClient({
      [STUB_ID]: createEchoHandler('stub-1'),
      myStubId: createEchoHandler('stub-2'),
    });
  });

  after(async () => {
    await localClient?.close();
  });

  it('should proxy requests by different stub ids', async () => {
    const response = await sendStubRequest('foo');
    assert.equal(response, 'Response from stub-1: foo');

    const response2 = await sendStubRequest('bar', 'myStubId');
    assert.equal(response2, 'Response from stub-2: bar');
  });
});
