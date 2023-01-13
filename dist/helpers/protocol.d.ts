/**
 * Protocol messages.
 */
import { Handler } from '@yandex-cloud/function-types';
export type Message = StubRequest | ClientRegister | ClientResponse | AckMessage;
export type StubId = string;
export type ReqId = string;
export type Payload = Record<string, unknown>;
export type ConnetionId = string;
interface BaseMessage {
    stubId: StubId;
    reqId: ReqId;
}
export interface StubRequest extends BaseMessage {
    type: 'stub.request';
    stubConnectionId: string;
    token: string;
    payload: Payload;
}
export interface ClientRegister extends BaseMessage {
    type: 'client.register';
    wsUrl: string;
}
export interface ClientResponse extends BaseMessage {
    type: 'client.response';
    payload: ReturnType<Handler.Http>;
}
export interface AckMessage extends BaseMessage {
    type: 'ack';
    error?: {
        code: string;
        message: string;
    };
}
export {};
//# sourceMappingURL=protocol.d.ts.map