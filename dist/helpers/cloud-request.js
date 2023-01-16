"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudRequest = void 0;
class CloudRequest {
    constructor(event, context) {
        this.event = event;
        this.context = context;
    }
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
    buildSuccessResponse(body) {
        const strBody = body === undefined
            ? undefined
            : (typeof body === 'object' ? JSON.stringify(body) : String(body));
        // todo: content type
        return {
            statusCode: 200,
            body: strBody,
        };
    }
    buildErrorResponse(e, statusCode = 500) {
        const body = `${e.stack}\nEVENT: ${JSON.stringify(this.event)}`;
        return {
            statusCode,
            body,
        };
    }
}
exports.CloudRequest = CloudRequest;
//# sourceMappingURL=cloud-request.js.map