/**
 * Protocol messages.
 */
export type Message = StubRequest | ClientRegister | ClientResponse | AckMessage;

export type StubId = string;
export type ReqId = string;
export type Payload = Record<string, unknown>;
export type ConnetionId = string;

interface BaseMessage {
  stubId: StubId,
  reqId: ReqId,
}

export interface StubRequest extends BaseMessage {
  type: 'stub.request',
  replyTo: ConnetionId,
  token: string,
  payload: Payload,
}

export interface ClientRegister extends BaseMessage {
  type: 'client.register',
}

export interface ClientResponse extends BaseMessage {
  type: 'client.response',
  payload: Payload,
}

export interface AckMessage extends BaseMessage {
  type: 'ack',
  error?: {
    code: string,
    message: string,
  }
}
