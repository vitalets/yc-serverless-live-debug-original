# yc-serverless-live-debug
Live debugging of Yandex cloud functions with local code on Node.js.

## How it works
There are 2 main components:
- **stub**: cloud function that proxies requests to local client via WebSocket API
- **local client**: WebSocket client that receives requests from stub, runs local code and returns response to stub

The process is following:
1. Local client connects to WebSocket API gateway (connection id is stored in YDB)
2. Stub receives HTTP request and checks is there connected local client
3. If local client exists stub re-sends request as WebSocket message
4. At the same time stub creates own WebSocket connection and waits response from local client. This trick allows to get response in the same instance of stub and respond to original request

The schema was inspired by [SST Live Lambda Dev](https://docs.sst.dev/live-lambda-development). But the implementation differs from SST as we use only 1 cloud function instead of 2.

## Deploy
To use live debug your need to deploy required components to your Yandex cloud account.
By default all components are deployed to separate cloud folder `live-debug`.
To deploy service you need [Yandex CLI]() and [Terraform]().

1. Clone the repo
   ```
   git clone ...
   cd yc-serverless-live-debug
   ```
2. Install dependencies
   ```
   npm ci
   ```
3. Run deploy commnd
   ```
   npm run deploy
   ```
4. Create `.env` file with the following values from deploy output:
   ```
   WS_URL=
   STUB_ID=
   STUB_URL=
   ```
5. Open YDB [web console](https://console.cloud.yandex.ru) and create table from [terraform/ydb.sql](/terraform/ydb.sql)

6. Run tests to ensure everything works:
   ```
   npm t
   ```

## Usage
To debug function locally in some project you need to import client from `yc-serverless-live-debug` directory and run it with your handler:

```ts
import { LocalClient } from 'path/to/yc-serverless-live-debug/dist/client';
import { handler } from 'path/to/your/handler';

const { WS_URL = '', STUB_ID = '' } = process.env;

(async () => {
  const client = new LocalClient({
    wsUrl: WS_URL,
    stubId: STUB_ID,
    handler,
  });

  await client.run();
})();
```
Exmaple of `handler.ts`:
```ts
export const handler = async event => {
  return {
    statusCode: 200,
    body: `Got request: ${event.body}`
  };
}
```
Start debugging:
```
ts-node debug.ts
```

See [example](/example) for more details.

