"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ws_client_1 = require("./helpers/ws-client");
const logger_1 = require("./helpers/logger");
const ydb_1 = require("./helpers/ydb");
const ws_apigw_1 = require("./helpers/ws-apigw");
const cloud_request_1 = require("./helpers/cloud-request");
const { STUB_WS_URL = '' } = process.env;
// reuse ws client between calls
let wsClient;
const handler = async (event, context) => {
    const req = new cloud_request_1.CloudRequest(event, context);
    try {
        const clientConnectionId = await getClientConnectionId(req);
        const wsClient = getWsClient();
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
};
exports.handler = handler;
async function getClientConnectionId(req) {
    const connection = await new ydb_1.Ydb(req.token).getConnection(req.functionId);
    if (!connection)
        throw new Error(`No client connections`);
    const { connectionId } = connection;
    logger_1.logger.info(`Client connection found: ${connectionId}`);
    return connectionId;
}
async function sendToLocalClient(clientConnectionId, req) {
    logger_1.logger.info(`Sending request to local client...`);
    const message = {
        type: 'request',
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
    if (message.type === 'response')
        return message;
    throw new Error(`Invalid response type: ${message.type}`);
}
function getWsClient() {
    wsClient = wsClient || new ws_client_1.WsClient(STUB_WS_URL);
    // todo: check disconnected
    return wsClient;
}
//# sourceMappingURL=stub.js.map