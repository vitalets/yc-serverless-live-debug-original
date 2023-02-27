import assert from 'node:assert/strict';
import { LocalClient, runLocalClient } from '../src/client';
import { createEchoHandler, readOutputs, sendStubRequest } from './helpers';

let localClient: LocalClient;

describe('live debug', () => {
  /** You should run 'npm run example:deploy' before tests */
  // todo: move outputs to helpers?
  const outputs = readOutputs('example/.live-debug/outputs.json');
  const stubUrl = `https://${outputs.apigwHost}`;

  afterEach(async () => {
    await localClient?.close();
  });

  it('successful request', async () => {
    localClient = await runLocalClient({
      wsHost: outputs.apigwHost,
      stubId: outputs.stubId,
      handler: createEchoHandler('foo'),
    });

    const response = await sendStubRequest(stubUrl, '123');
    assert.equal(response, 'Response from foo: 123');

    const response2 = await sendStubRequest(stubUrl, '456');
    assert.equal(response2, 'Response from foo: 456');
  });

  it('no local clients', async () => {
    const promise = sendStubRequest(stubUrl, '123');
    await assert.rejects(promise, /No clients connected/);
  });

});
