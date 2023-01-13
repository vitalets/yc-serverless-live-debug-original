"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsClient = void 0;
const node_events_1 = require("node:events");
const ws_1 = __importDefault(require("ws"));
const logger_1 = require("./logger");
class WsClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.connectionId = '';
        this.waitFns = new Map();
    }
    async ensureConnected() {
        if (this.ws?.readyState === ws_1.default.OPEN) {
            logger_1.logger.info(`WS connection already open`);
            return;
        }
        await new Promise(resolve => {
            this.ws = new ws_1.default(this.wsUrl);
            this.ws.on('open', resolve);
            this.ws.on('upgrade', req => this.onUpgrade(req));
            this.ws.on('message', message => this.onMessage(message));
            this.ws.on('close', (code, reason) => this.onClose(code, reason));
            // todo: connection error
            // todo: timeout
        });
        logger_1.logger.info(`WS connection opened`);
    }
    async sendJson(message) {
        const strMessage = JSON.stringify(message);
        logger_1.logger.debug(`WS ->: ${strMessage}`);
        this.ws?.send(strMessage);
    }
    clearListeners() {
        this.waitFns.clear();
    }
    async waitMessage(fn) {
        // todo: timeout
        return new Promise((resolve, reject) => {
            this.waitFns.set(fn, { resolve, reject });
        });
    }
    async close() {
        if (this.ws.readyState === ws_1.default.OPEN) {
            this.ws.close();
            await (0, node_events_1.once)(this.ws, 'close');
        }
    }
    onMessage(message) {
        logger_1.logger.debug(`WS <-: ${message}`);
        const jsonMessage = JSON.parse(message.toString());
        this.waitFns.forEach(({ resolve, reject }, fn) => {
            if (!fn(jsonMessage))
                return;
            if (jsonMessage.type === 'ack' && jsonMessage.error) {
                reject(new Error(jsonMessage.error.message));
            }
            else {
                resolve(jsonMessage);
            }
        });
        this.onJsonMessage?.(jsonMessage);
    }
    onUpgrade(req) {
        this.connectionId = req.headers['x-yc-apigateway-websocket-connection-id'];
    }
    onClose(code, reason) {
        logger_1.logger.info(`WS connection closed: ${code} ${reason}`);
        // todo: remove listeners
    }
}
exports.WsClient = WsClient;
//# sourceMappingURL=ws-client.js.map