"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ydb = void 0;
/**
 * YDB wrapper.
 */
const ydb_sdk_1 = require("ydb-sdk");
const logger_1 = require("./logger");
const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;
let ydbDriver;
class Ydb {
    constructor(token) {
        this.token = token;
    }
    async getConnection(stubId) {
        const query = `
      DECLARE $stubId AS Utf8;

      SELECT connectionId, wsUrl, createdAt
      FROM connections WHERE stubId = $stubId
      ORDER BY createdAt DESC
      LIMIT 1
    `;
        const resultSets = await this.withSession(async (session) => {
            const preparedQuery = await session.prepareQuery(query);
            const params = {
                '$stubId': ydb_sdk_1.TypedValues.utf8(stubId),
            };
            const { resultSets } = await session.executeQuery(preparedQuery, params);
            return resultSets;
        });
        const rows = ydb_sdk_1.TypedData.createNativeObjects(resultSets[0]);
        return rows.length ? rows[0] : undefined;
    }
    async saveConnection(stubId, connectionId, wsUrl) {
        const query = `
      DECLARE $stubId AS Utf8;
      DECLARE $connectionId AS Utf8;
      DECLARE $wsUrl AS Utf8;

      UPSERT INTO connections (stubId, connectionId, wsUrl, createdAt)
      VALUES ($stubId, $connectionId, $wsUrl, CurrentUtcTimestamp());
    `;
        const result = await this.withSession(async (session) => {
            const preparedQuery = await session.prepareQuery(query);
            const params = {
                '$stubId': ydb_sdk_1.TypedValues.utf8(stubId),
                '$connectionId': ydb_sdk_1.TypedValues.utf8(connectionId),
                '$wsUrl': ydb_sdk_1.TypedValues.utf8(wsUrl),
            };
            return session.executeQuery(preparedQuery, params);
        });
        logger_1.logger.debug('Connection saved', result);
    }
    async withSession(callback) {
        const driver = await this.getDriver();
        return driver.tableClient.withSession(callback);
    }
    async getDriver() {
        ydbDriver = ydbDriver || new ydb_sdk_1.Driver({
            endpoint: YDB_ENDPOINT,
            database: YDB_PATH,
            authService: new ydb_sdk_1.TokenAuthService(this.token)
        });
        if (!await ydbDriver.ready(3000)) {
            throw new Error(`YDB driver has not become ready in allowed time!`);
        }
        return ydbDriver;
    }
}
exports.Ydb = Ydb;
//# sourceMappingURL=ydb.js.map