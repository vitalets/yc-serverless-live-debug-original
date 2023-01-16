"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
/**
 * Store function saves client connection info in YDB.
 */
const logger_1 = require("./helpers/logger");
const ydb_1 = require("./helpers/ydb");
const cloud_request_1 = require("./helpers/cloud-request");
const handler = async (event, context) => {
    const req = new cloud_request_1.CloudRequest(event, context);
    if (req.isWebSocketRequest() && req.wsEventType === 'CONNECT') {
        return saveClientConnectionInfo(req);
    }
    else {
        return req.buildErrorResponse(new Error('Unsupported request'));
    }
};
exports.handler = handler;
async function saveClientConnectionInfo(req) {
    try {
        const stubId = req.event.headers['X-Stub-Id'];
        logger_1.logger.info(`client connect: stubId=${stubId}, connId=${req.wsConnectionId}`);
        await new ydb_1.Ydb(req.token).saveConnection(stubId, req.wsConnectionId);
        return req.buildSuccessResponse();
    }
    catch (e) {
        logger_1.logger.error(e);
        return req.buildErrorResponse(e);
    }
}
//# sourceMappingURL=store.js.map