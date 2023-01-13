/**
 * Local client that receives WebSocket message, runs local code
 * and sends result back to stub function.
 */
import { ClientResponse, StubRequest } from './helpers/protocol';
import { WsClient } from './helpers/ws-client';
export type LocalClientOptions = {
    wsUrl: string;
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
    protected register(): Promise<void>;
    protected waitRequests(): void;
    protected getResponsePayload(request: StubRequest): Promise<import("@yandex-cloud/function-types/dist/src/http").Http.Result | {
        statusCode: number;
        body: any;
    }>;
    protected sendResponse(message: StubRequest, payload: ClientResponse['payload']): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map