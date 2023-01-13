# yc-serverless-live-debug
Live debug of Yandex cloud functions with local code on Node.js.

## How it works
![live-debug](https://user-images.githubusercontent.com/1473072/212291689-e5b0f31a-9abd-4e9b-9a79-57f574831f3c.png)

There are 3 main components:
- **API gateway**: routes HTTP requests to Stub function and holds WebSocket connections
- **Stub function**: cloud function that proxies HTTP requests to local client via WebSocket API
- **Local client**: WebSocket client on localhost that receives requests from stub, executes local code and returns response to stub

The process is following:
1. Local client connects to WebSocket API gateway (connection id is stored in YDB)
2. Stub receives HTTP request and checks in YDB is there connection from local client
3. If local client exists stub re-sends request to it as WebSocket message. Also stub creates own WebSocket connection to allow local client to send a response to exactly this instance of stub
4. Local client receives HTTP request as WebSocket message, runs code locally and send response back as WebSocket message

> The schema was inspired by [SST Live Lambda Dev](https://docs.sst.dev/live-lambda-development). Actual implementation differs from SST as we use only 1 cloud function instead of 2.

## Deploy
To use live debug your need to deploy required components to your Yandex cloud account.
By default all components are deployed to separate cloud folder `live-debug`.
To deploy service you need [Yandex CLI](https://cloud.yandex.ru/docs/cli/) and [Terraform](https://cloud.yandex.ru/docs/tutorials/infrastructure-management/terraform-quickstart).

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

