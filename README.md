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
   Output:
   ```
   WS connection opened
   Waiting requests from stub...
   Click this url to send request: https://**********.apigw.yandexcloud.net
   Got request from stub: 58ea5f4c-bc04-4275-b62e-dce809591926
   Waiting response from local code...
   Got response from local code
   WS sending message to connection: d20438soh73hn36us5kcd25irkmg6611n
   WS message sent to connection: d20438soh73hn36us5kcd25irkmg6611n
   Response sent
   ```

## Usage
To debug cloud function locally create `debug.ts` like follows:

```ts
/** local client that connects to WebSocket */
import { LocalClient } from 'path/to/yc-serverless-live-debug/dist/client';
/** your code to handle requests */
import { handler } from 'path/to/your/handler';

(async () => {
  const client = new LocalClient({
    /** live debug API-gateway WebSocket url */
    wsUrl: process.env.CLIENT_WS_URL,
    /** Stub function id to listen requests from */
    stubId: process.env.STUB_ID,
    /** local handler */
    handler,
  });

  await client.run();
})();
```
Example of `handler.ts`:
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

