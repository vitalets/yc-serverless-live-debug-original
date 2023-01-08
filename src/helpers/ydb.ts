/**
 * YDB wrapper.
 */
import { Driver, Session, TokenAuthService, TypedData, TypedValues } from 'ydb-sdk';
import { logger } from './logger';

const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;
let ydbDriver: Driver;

type Connection = {
  connectionId: string,
  topic: string,
  createdAt: string,
};

export class Ydb {
  constructor(protected token: string) {}

  async getConnectionId(stubId: string) {
    const query = `
      DECLARE $stubId AS Utf8;

      SELECT connectionId, createdAt FROM connections WHERE stubId = $stubId
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
    return rows[0]?.connectionId || '';
  }

  async saveConnectionId(stubId: string, connectionId: string) {
    const query = `
      DECLARE $connectionId AS Utf8;
      DECLARE $stubId AS Utf8;

      INSERT INTO connections (connectionId, stubId, createdAt)
      VALUES ($connectionId, $stubId, CurrentUtcTimestamp());
    `;
    const result = await this.withSession(async session => {
      const preparedQuery = await session.prepareQuery(query);
      const params = {
        '$connectionId': TypedValues.utf8(connectionId),
        '$stubId': TypedValues.utf8(stubId),
      };
      return session.executeQuery(preparedQuery, params);
    });
    console.log(result);
  }

  async getConnections() {
    const query = `
      SELECT connectionId, stubId, createdAt FROM connections;
    `;
    const resultSets = await this.withSession(async session => {
      const { resultSets } = await session.executeQuery(query);
      return resultSets;
    });
    const rows = TypedData.createNativeObjects(resultSets[0]) as unknown as Connection[];
    return rows;
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

export async function ensureTable() {
  // todo: create table dynamically by http route
}


