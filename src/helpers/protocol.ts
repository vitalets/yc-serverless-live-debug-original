/**
 * Protocol messages.
 */
import { Handler } from '@yandex-cloud/function-types';
import { CloudContext, HttpEvent, WsEvent } from './cloud-request';

export type WsMessage = WsRequest | WsResponse;

export interface WsRequest {
  type: 'request',
  reqId: string,
  stubId: string,
  stubConnectionId: string,
  token: string,
  payload: {
    event: HttpEvent | WsEvent,
    context: CloudContext,
  },
}

export interface WsResponse {
  type: 'response',
  reqId: string,
  payload: ReturnType<Handler.Http>,
}
