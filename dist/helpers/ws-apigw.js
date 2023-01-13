"use strict";
/**
 * Send message to WS connection on API gateway.
 * See: https://cloud.yandex.ru/docs/api-gateway/apigateway/websocket/api-ref/Connection/send
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApigwError = exports.sendToConnection = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = require("./logger");
const URL_TPL = `https://apigateway-connections.api.cloud.yandex.net/apigateways/websocket/v1/connections/{connectionId}/:send`;
async function sendToConnection(connectionId, 
// see: https://stackoverflow.com/questions/66603759/accept-any-object-as-argument-in-function
// eslint-disable-next-line @typescript-eslint/ban-types
message, token) {
    logger_1.logger.info(`WS sending message to connection: ${connectionId}`);
    const method = 'POST';
    const url = URL_TPL.replace('{connectionId}', connectionId);
    const headers = {
        Authorization: `Bearer ${token}`,
    };
    const body = buildTextBody(message);
    const res = await (0, node_fetch_1.default)(url, { method, headers, body });
    if (!res.ok) {
        const { message, code } = await res.json();
        throw new ApigwError(message, code);
    }
    logger_1.logger.info(`WS message sent to connection: ${connectionId}`);
}
exports.sendToConnection = sendToConnection;
class ApigwError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.ApigwError = ApigwError;
function buildTextBody(message) {
    const messageStr = JSON.stringify(message);
    return JSON.stringify({
        type: 'TEXT',
        data: Buffer.from(messageStr, 'utf8').toString('base64'),
    });
}
//# sourceMappingURL=ws-apigw.js.map