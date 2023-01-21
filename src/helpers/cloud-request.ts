/**
 * Cloud function request wrapper.
 */
import { Handler } from '@yandex-cloud/function-types';

export type HttpEvent = Parameters<Handler.Http>[ 0 ];
export type WsEvent =
  | Parameters<Handler.ApiGateway.WebSocket.Connect>[ 0 ]
  | Parameters<Handler.ApiGateway.WebSocket.Message>[ 0 ]
  | Parameters<Handler.ApiGateway.WebSocket.Disconnect>[ 0 ];
export type CloudContext = Parameters<Handler.Http>[ 1 ];

export class CloudRequest {
  private decodedBody?: string;

  constructor(public event: HttpEvent | WsEvent, public context: CloudContext) { }

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
    return 'connectionId' in this.event.requestContext
      ? this.event.requestContext.connectionId
      : '';
  }

  get wsEventType() {
    return 'eventType' in this.event.requestContext
      ? this.event.requestContext.eventType
      : '';
  }

  get body() {
    if ('body' in this.event && this.decodedBody === undefined) {
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

  buildSuccessResponse(body?: unknown) {
    const strBody = body === undefined
      ? undefined
      : (typeof body === 'object' ? JSON.stringify(body) : String(body));
    // todo: content type
    return {
      statusCode: 200,
      body: strBody,
    };
  }

  buildErrorResponse(e: Error, statusCode = 500) {
    const body = `${e.stack}\nEVENT: ${JSON.stringify(this.event)}`;
    return {
      statusCode,
      body,
    };
  }
}
