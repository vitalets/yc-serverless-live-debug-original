import 'dotenv/config';
import { LocalClient } from '../dist/client';
import { handler } from './handler';

const { CLIENT_WS_URL = '', STUB_ID = '', STUB_URL = ''} = process.env;

(async () => {
  const client = new LocalClient({
    wsUrl: CLIENT_WS_URL,
    stubId: STUB_ID,
    handler,
  });

  await client.run();
  console.log(`Click this url to send request: ${STUB_URL}`);
})();
