# yc-serverless-live-debug
Local debug of Yandex Cloud Functions on Node.js.

<!-- toc -->

- [How it works](#how-it-works)
- [Deploy](#deploy)
- [Usage](#usage)

<!-- tocstop -->

## How it works
![live-debug](https://user-images.githubusercontent.com/1473072/212640296-5047ddc9-2f5b-4366-9ee0-bb32e18f06e1.png)

The process is following:
1. Stub cloud function receives HTTP request via API gateway
2. Then it checks in YDB is there connected WebSocket clients from localhost
3. If local client exist stub function re-sends request to it as WebSocket message
4. Also stub creates own WebSocket connection to allow local client to respond exactly to this instance of stub
5. Local client receives request, handles it with local code, and sends response back to stub via WebSocket
6. Stub waits response from client and returns it as a result to incoming HTTP request

> The schema was inspired by [SST Live Lambda Dev](https://docs.sst.dev/live-lambda-development) with some optimizations.

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
   CLIENT_WS_URL=
   STUB_ID=
   STUB_URL=
   ```
5. Open YDB [web console](https://console.cloud.yandex.ru) and create table from [terraform/ydb.sql](/terraform/ydb.sql)

6. Run tests to ensure everything works:
   ```
   npm t
   ```
7. Run example and click provided url:
   ```
   npm run example
   ```

## Usage
To debug function locally in some project you need to import client from `yc-serverless-live-debug` directory and run it with your handler:

```ts
import { LocalClient } from 'path/to/yc-serverless-live-debug/dist/client';
import { handler } from 'path/to/your/handler';

const { CLIENT_WS_URL = '', STUB_ID = '' } = process.env;

(async () => {
  const client = new LocalClient({
    wsUrl: CLIENT_WS_URL,
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

