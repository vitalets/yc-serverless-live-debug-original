/**
 * Protocol messages.
 */
export type Message = StubRequest | LocalRegister | LocalResponse | AckMessage;

export type Topic = string;
export type ReqId = string;
export type Payload = Record<string, unknown>;
export type ConnetionId = string;

interface BaseMessage {
  topic: Topic,
  reqId: ReqId,
}

export interface StubRequest extends BaseMessage {
  type: 'stub.request',
  replyTo: ConnetionId,
  payload: Payload,
}

export interface LocalRegister extends BaseMessage {
  type: 'local.register',
}

export interface LocalResponse extends BaseMessage {
  type: 'local.response',
  replyTo: ConnetionId,
  payload: Payload,
}

export interface AckMessage extends BaseMessage {
  type: 'ack',
  error?: {
    code: string,
    message: string,
  }
}
