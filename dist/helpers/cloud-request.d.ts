/**
 * Cloud function request wrapper.
 */
import { Handler } from '@yandex-cloud/function-types';
export type HttpEvent = Parameters<Handler.Http>[0];
export type WsEvent = Parameters<Handler.ApiGateway.WebSocket.Connect>[0] | Parameters<Handler.ApiGateway.WebSocket.Message>[0] | Parameters<Handler.ApiGateway.WebSocket.Disconnect>[0];
export type CloudContext = Parameters<Handler.Http>[1];
export declare class CloudRequest {
    event: HttpEvent | WsEvent;
    context: CloudContext;
    private decodedBody?;
    constructor(event: HttpEvent | WsEvent, context: CloudContext);
    get id(): string;
    get token(): string;
    get functionId(): string;
    get wsConnectionId(): string;
    get wsEventType(): "" | "CONNECT" | "MESSAGE" | "DISCONNECT";
    get body(): string | undefined;
    isWebSocketRequest(): boolean;
    buildSuccessResponse(body?: unknown): {
        statusCode: number;
        body: string | undefined;
    };
    buildErrorResponse(e: Error, statusCode?: number): {
        statusCode: number;
        body: string;
    };
}
//# sourceMappingURL=cloud-request.d.ts.map