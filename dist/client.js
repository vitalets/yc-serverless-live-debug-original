"use strict";
/**
 * Local client that receives WebSocket message, runs local code
 * and sends result back to stub function.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalClient = void 0;
const ws_client_1 = require("./helpers/ws-client");
const logger_1 = require("./helpers/logger");
const ws_apigw_1 = require("./helpers/ws-apigw");
class LocalClient {
    constructor(options) {
        this.options = options;
        this.wsClient = new ws_client_1.WsClient(options.wsUrl);
    }
    async run() {
        await this.wsClient.ensureConnected();
        await this.register();
        this.waitRequests();
    }
    async close() {
        await this.wsClient.close();
    }
    async ensureConnected() {
        await this.wsClient.ensureConnected();
        logger_1.logger.info('Local client connected');
    }
    async register() {
        logger_1.logger.info('Registering local client...');
        const message = {
            type: 'client.register',
            wsUrl: this.wsClient.ws.url,
            stubId: this.options.stubId,
            reqId: Date.now().toString(),
        };
        this.wsClient.sendJson(message);
        await this.wsClient.waitMessage(m => m.reqId === message.reqId);
        logger_1.logger.info('Local client registered');
    }
    waitRequests() {
        logger_1.logger.info(`Waiting requests from stub...`);
        this.wsClient.onJsonMessage = async (message) => {
            if (message.type !== 'stub.request')
                return;
            logger_1.logger.info(`Got request from stub: ${message.reqId}`);
            const responsePayload = await this.getResponsePayload(message);
            await this.sendResponse(message, responsePayload);
        };
    }
    async getResponsePayload(request) {
        try {
            const { event, context } = request.payload;
            logger_1.logger.info(`Waiting response from local code...`);
            const payload = await this.options.handler(event, context);
            logger_1.logger.info(`Got response from local code`);
            return payload;
        }
        catch (e) {
            logger_1.logger.error(e);
            return {
                statusCode: 500,
                body: e.stack,
            };
        }
    }
    async sendResponse(message, payload) {
        const response = {
            type: 'client.response',
            stubId: message.stubId,
            reqId: message.reqId,
            payload,
        };
        await (0, ws_apigw_1.sendToConnection)(message.stubConnectionId, response, message.token);
        logger_1.logger.info('Response sent');
    }
}
exports.LocalClient = LocalClient;
//# sourceMappingURL=client.js.map