/**
 * YDB wrapper.
 */
import { Driver, Session, TokenAuthService, TypedData, TypedValues } from 'ydb-sdk';
import { logger } from './logger';

const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;
let ydbDriver: Driver;

type Connection = {
  stubId: string,
  connectionId: string,
  wsUrl: string,
  createdAt: string,
};

export class Ydb {
  constructor(protected token: string) {}

  async getConnection(stubId: string) {
    const query = `
      DECLARE $stubId AS Utf8;

      SELECT connectionId, wsUrl, createdAt
      FROM connections WHERE stubId = $stubId
      ORDER BY createdAt DESC
      LIMIT 1
    `;
    const resultSets = await this.withSession(async session => {
      const preparedQuery = await session.prepareQuery(query);
      const params = {
        '$stubId': TypedValues.utf8(stubId),
      };
      const { resultSets } = await session.executeQuery(preparedQuery, params);
      return resultSets;
    });
    const rows = TypedData.createNativeObjects(resultSets[0]) as unknown as Connection[];
    return rows.length ? rows[0] : undefined;
  }

  async saveConnection(stubId: string, connectionId: string, wsUrl: string) {
    const query = `
      DECLARE $stubId AS Utf8;
      DECLARE $connectionId AS Utf8;
      DECLARE $wsUrl AS Utf8;

      UPSERT INTO connections (stubId, connectionId, wsUrl, createdAt)
      VALUES ($stubId, $connectionId, $wsUrl, CurrentUtcTimestamp());
    `;
    const result = await this.withSession(async session => {
      const preparedQuery = await session.prepareQuery(query);
      const params = {
        '$stubId': TypedValues.utf8(stubId),
        '$connectionId': TypedValues.utf8(connectionId),
        '$wsUrl': TypedValues.utf8(wsUrl),
      };
      return session.executeQuery(preparedQuery, params);
    });
    logger.debug('Connection saved', result);
  }

  protected async withSession<T>(callback: (session: Session) => Promise<T>) {
    const driver = await this.getDriver();
    return driver.tableClient.withSession(callback);
  }

  protected async getDriver() {
    ydbDriver = ydbDriver || new Driver({
      endpoint: YDB_ENDPOINT,
      database: YDB_PATH,
      authService: new TokenAuthService(this.token)
    });

    if (!await ydbDriver.ready(3000)) {
      throw new Error(`YDB driver has not become ready in allowed time!`);
    }

    return ydbDriver;
  }
}
