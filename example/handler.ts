import { Handler } from '@yandex-cloud/function-types';

export const handler: Handler.Http = async event => {
  return {
    statusCode: 200,
    body: `Hello from local code! Your headers: ${JSON.stringify(event.headers, null, 2)}`
  };
}
