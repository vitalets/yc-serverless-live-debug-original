import { Handler } from '@yandex-cloud/function-types';

export const handler: Handler.Http = async event => {
  return {
    statusCode: 200,
    body: `Got request: ${event.body}`
  };
}
