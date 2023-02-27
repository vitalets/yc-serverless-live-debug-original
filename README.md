# yc-serverless-live-debug
Local debug of Yandex Cloud Functions on Node.js.

<!-- toc -->

- [How it works](#how-it-works)
- [Setup](#setup)
- [Usage](#usage)
    + [Debug single function](#debug-single-function)
    + [Debug several functions](#debug-several-functions)
    + [Debug other triggers](#debug-other-triggers)

<!-- tocstop -->

## How it works
![diagram](https://user-images.githubusercontent.com/1473072/221630804-855844d9-7b38-40ed-a5ce-b62939d65ae1.png)

Main components:
1. `stub` - cloud function that proxies requests to local code
2. `store` - cloud function that stores WebSocket connections info in YDB. This connection info is later used by `stub` to know where to proxy request
3. `client` - CLI app running on local machine and handling requests coming by WebSocket

> The schema was inspired by [SST Live Lambda Dev](https://docs.sst.dev/live-lambda-development)

## Setup
Install package:
```
npm i -D @vitalets/live-debug
```

Deploy cloud components:
```
npx live-debug deploy
```

> By default this command uses [yc cli](https://cloud.yandex.ru/docs/cli/) to get auth token and cloud id. You can manually set these values by `YC_TOKEN` and `YC_CLOUD_ID` env vars

> To authorize by service account key use `YC_SERVICE_ACCOUNT_KEY_FILE` env var

```
YC_SERVICE_ACCOUNT_KEY_FILE=path/to/key.json npx live-debug deploy
```

> By default all components will be created in separate catalogue `live-debug`. You can change this name using `LIVE_DEBUG_FOLDER_NAME` env var
```
LIVE_DEBUG_FOLDER_NAME=live-debug-test npx live-debug deploy
```

Create `live-debug.config.ts` (or `live-debug.config.js`) in project root:
```ts
import { defineConfig } from '@vitalets/live-debug';

export default defineConfig({
  handler: event => {
    console.log('got request', event);
    return {
      statusCode: 200,
      body: `Hello from local code!`,
    };
  }
});
```

Run live debug:
```
npx live-debug run
```
Expected output:
```
Reading config: /project/live-debug.config
Running local client...
WS connection opened
Local client connected
Check url: https://**********.apigw.yandexcloud.net
Waiting requests...
GET /?
Response sent
```

See [example](/example) for more details.

## Usage
On server all requests are handled by single `stub` function.
You can setup routing for your needs in the config.

#### Debug single function
For single function you can just assign handler from your code:
```ts
import { defineConfig } from '@vitalets/live-debug';
import { handler } from './path/to/your/handler';

export default defineConfig({
  handler
});
```

#### Debug several functions
To debug several functions simultaneously you can setup routing by url:
```ts
import { defineConfig } from '@vitalets/live-debug';
import { Handler } from '@yandex-cloud/function-types';
import { handlerA } from './path/to/your/handler-a';
import { handlerB } from './path/to/your/handler-b';

export default defineConfig({
  handler: <Handler.Http>((event, ctx) => {
    // @ts-expect-error url is not typed
    const url = String(event.url);
    if (url.startsWith('/handler-a')) return handlerA(event, ctx);
    if (url.startsWith('/handler-b')) return handlerB(event, ctx);
    return { statusCode: 200, body: 'No handler' };
  })
});
```

#### Debug other triggers
You can debug other triggers: message queue, object storage, etc.
In cloud console configure needed trigger to point to `stub` function.
```ts
import { defineConfig } from '@vitalets/live-debug';
import { Handler } from '@yandex-cloud/function-types';

export default defineConfig({
  handler: <Handler.MessageQueue>(event => {
    console.log(event.messages);
  })
});
```
