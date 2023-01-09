/**
 * Cloud function request wrapper.
 */
import { Handler } from '@yandex-cloud/function-types';

type HttpEvent = Parameters<Handler.Http>[ 0 ];
type Context = Parameters<Handler.Http>[ 1 ];

export class CloudRequest {
  private decodedBody?: string;

  constructor(public event: HttpEvent, public context: Context) { }

  get id() {
    return this.context.requestId || '';
  }

  get token() {
    return this.context.token?.access_token || '';
  }

  get functionId() {
    return this.context.functionName;
  }

  get wsConnectionId() {
    // @ts-expect-error see https://github.com/yandex-cloud/function-ts-types/issues/8
    return this.event.requestContext.connectionId;
  }

  get wsEventType() {
    // @ts-expect-error see https://github.com/yandex-cloud/function-ts-types/issues/8
    return this.event.requestContext.eventType;
  }

  get body() {
    if (this.decodedBody === undefined) {
      const { body, isBase64Encoded } = this.event;
      this.decodedBody = isBase64Encoded
        ? Buffer.from(body, 'base64').toString('utf8')
        : body;
    }

    return this.decodedBody;
  }

  isWebSocketRequest() {
    return Boolean(this.wsConnectionId);
  }

  buildResponse(body?: unknown) {
    const strBody = body === undefined
      ? undefined
      : (typeof body === 'object' ? JSON.stringify(body) : String(body));
    return {
      statusCode: 200,
      body: strBody,
    };
  }

  buildErrorResponse(e: Error) {
    const body = `${e.stack}\nEVENT: ${JSON.stringify(this.event)}`;
    return {
      statusCode: 500,
      body,
    };
  }
}
