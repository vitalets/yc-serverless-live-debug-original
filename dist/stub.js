"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ws_client_1 = require("./helpers/ws-client");
const logger_1 = require("./helpers/logger");
const ydb_1 = require("./helpers/ydb");
const ws_apigw_1 = require("./helpers/ws-apigw");
const cloud_request_1 = require("./helpers/cloud-request");
// reuse ws client between calls
let wsClient;
const handler = async (event, context) => {
    const req = new cloud_request_1.CloudRequest(event, context);
    return handleClientRegister(req) || handleHttpRequest(req);
};
exports.handler = handler;
function handleClientRegister(req) {
    if (req.isWebSocketRequest() && req.wsEventType === 'MESSAGE') {
        const message = JSON.parse(req.body);
        if (message.type === 'client.register') {
            return storeClientConnectionInfo(req, message);
        }
    }
}
async function handleHttpRequest(req) {
    try {
        const { clientConnectionId, wsUrl } = await getClientConnection(req);
        const wsClient = getWsClient(wsUrl);
        await wsClient.ensureConnected();
        await sendToLocalClient(clientConnectionId, req);
        const response = await waitResponse(wsClient, req.id);
        return response.payload;
    }
    catch (e) {
        logger_1.logger.error(e.stack);
        return req.buildErrorResponse(e);
    }
    finally {
        wsClient.clearListeners();
    }
}
async function storeClientConnectionInfo(req, msg) {
    logger_1.logger.info('client register', JSON.stringify(msg));
    const ackMessage = {
        type: 'ack',
        stubId: req.functionId,
        reqId: msg.reqId,
    };
    try {
        await new ydb_1.Ydb(req.token).saveConnection(req.functionId, req.wsConnectionId, msg.wsUrl);
        return req.buildResponse(ackMessage);
    }
    catch (e) {
        logger_1.logger.error(e);
        ackMessage.error = {
            code: 'error',
            message: e.stack,
        };
        return req.buildResponse(ackMessage);
    }
}
async function getClientConnection(req) {
    const connection = await new ydb_1.Ydb(req.token).getConnection(req.functionId);
    if (!connection)
        throw new Error(`No client connections`);
    return {
        clientConnectionId: connection.connectionId,
        wsUrl: connection.wsUrl,
    };
}
async function sendToLocalClient(clientConnectionId, req) {
    logger_1.logger.info(`Sending request to local client...`);
    const message = {
        type: 'stub.request',
        stubId: req.functionId,
        reqId: req.id,
        stubConnectionId: wsClient.connectionId,
        token: req.token,
        payload: {
            event: req.event,
            context: req.context,
        },
    };
    try {
        await (0, ws_apigw_1.sendToConnection)(clientConnectionId, message, req.token);
    }
    catch (e) {
        if (e instanceof ws_apigw_1.ApigwError && e.code === 5) {
            throw new Error(`No clients connected.`);
        }
        else {
            throw e;
        }
    }
    return message;
}
async function waitResponse(wsClient, reqId) {
    logger_1.logger.info(`Waiting response...`);
    const message = await wsClient.waitMessage(m => m.reqId === reqId);
    logger_1.logger.info(`Got response: ${JSON.stringify(message)}`);
    if (message.type === 'client.response')
        return message;
    throw new Error(`Invalid response type: ${message.type}`);
}
function getWsClient(wsUrl) {
    wsClient = wsClient || new ws_client_1.WsClient(wsUrl);
    return wsClient;
}
//# sourceMappingURL=stub.js.map