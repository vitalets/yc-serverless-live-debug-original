/**
 * Protocol messages.
 */
import { Handler } from '@yandex-cloud/function-types';
export type WsMessage = WsRequest | WsResponse;
interface BaseMessage {
    stubId: string;
    reqId: string;
}
export interface WsRequest extends BaseMessage {
    type: 'request';
    stubConnectionId: string;
    token: string;
    payload: {
        event: Parameters<Handler.Http>[0];
        context: Parameters<Handler.Http>[1];
    };
}
export interface WsResponse extends BaseMessage {
    type: 'response';
    payload: ReturnType<Handler.Http>;
}
export {};
//# sourceMappingURL=protocol.d.ts.map