/**
 * Cloud function request wrapper.
 */
import { Handler } from '@yandex-cloud/function-types';
type HttpEvent = Parameters<Handler.Http>[0];
type Context = Parameters<Handler.Http>[1];
export declare class CloudRequest {
    event: HttpEvent;
    context: Context;
    private decodedBody?;
    constructor(event: HttpEvent, context: Context);
    get id(): string;
    get token(): string;
    get functionId(): string;
    get wsConnectionId(): any;
    get wsEventType(): any;
    get body(): string;
    isWebSocketRequest(): boolean;
    buildResponse(body?: unknown): {
        statusCode: number;
        body: string | undefined;
    };
    buildErrorResponse(e: Error): {
        statusCode: number;
        body: string;
    };
}
export {};
//# sourceMappingURL=cloud-request.d.ts.map