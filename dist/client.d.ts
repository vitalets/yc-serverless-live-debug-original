/**
 * Local WebSocket client that receives request, runs local code
 * and sends result back to stub function.
 */
import { WsRequest, WsResponse } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
export type LocalClientOptions = {
    wsUrl: string;
    /** Unique id of stub function. Allows to route multiple stubs/clients via single ydb */
    stubId: string;
    handler: Function;
};
export declare class LocalClient {
    protected options: LocalClientOptions;
    wsClient: WsClient;
    constructor(options: LocalClientOptions);
    run(): Promise<void>;
    close(): Promise<void>;
    protected ensureConnected(): Promise<void>;
    protected waitRequests(): void;
    protected getResponsePayload(request: WsRequest): Promise<import("@yandex-cloud/function-types/dist/src/http").Http.Result | {
        statusCode: number;
        body: any;
    }>;
    protected sendResponse(message: WsRequest, payload: WsResponse['payload']): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map