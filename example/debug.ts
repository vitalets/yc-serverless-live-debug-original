import 'dotenv/config';
import { LocalClient } from '../dist/client';
import { handler } from './handler';

const { WS_URL = '', STUB_ID = '', STUB_URL } = process.env;

(async () => {
  const client = new LocalClient({
    wsUrl: WS_URL,
    stubId: STUB_ID,
    handler,
  });

  await client.run();
  console.log(`Waiting requests to: ${STUB_URL}`);
})();
