/**
 * Protocol messages.
 */
import { Handler } from '@yandex-cloud/function-types';

export type WsMessage = WsRequest | WsResponse;

export interface WsRequest {
  type: 'request',
  reqId: string,
  stubId: string,
  stubConnectionId: string,
  token: string,
  payload: {
    event: Parameters<Handler.Http>[0],
    context: Parameters<Handler.Http>[1],
  },
}

export interface WsResponse {
  type: 'response',
  reqId: string,
  payload: ReturnType<Handler.Http>,
}
