/**
 * Send message to WS connection on API gateway.
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 */
export declare function sendToConnection(connectionId: string, message: object, token: string): Promise<void>;
export declare class ApigwError extends Error {
    code: number;
    constructor(message: string, code: number);
}
//# sourceMappingURL=ws-apigw.d.ts.map