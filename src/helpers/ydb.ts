import { Driver, TokenAuthService, TypedData, TypedValues } from 'ydb-sdk';

const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;
let ydbDriver: Driver;

type Connection = {
  connectionId: string,
  topic: string,
  createdAt: string,
};

export async function getConnectionId(topic: string, token: string) {
  const driver = await getYdbDriver(token);
  const query = `
    DECLARE $topic AS Utf8;

    SELECT connectionId FROM connections WHERE topic = $topic
    ORDER BY createdAt DESC
    LIMIT 1
  `;
  const resultSets = await driver.tableClient.withSession(async session => {
    const preparedQuery = await session.prepareQuery(query);
    const params = {
      '$topic': TypedValues.utf8(topic),
    };
    const { resultSets } = await session.executeQuery(preparedQuery, params);
    return resultSets;
  });
  const rows = TypedData.createNativeObjects(resultSets[0]) as unknown as Connection[];
  return rows[0]?.connectionId || '';
}

export async function saveConnectionId(topic: string, connectionId: string, token: string) {
  const driver = await getYdbDriver(token);
  const query = `
    DECLARE $connectionId AS Utf8;
    DECLARE $topic AS Utf8;

    INSERT INTO connections (connectionId, topic, createdAt)
    VALUES ($connectionId, $topic, CurrentUtcTimestamp());
  `;
  const resultSets = await driver.tableClient.withSession(async session => {
    const preparedQuery = await session.prepareQuery(query);
    const params = {
      '$connectionId': TypedValues.utf8(connectionId),
      '$topic': TypedValues.utf8(topic),
    };
    const { resultSets } = await session.executeQuery(preparedQuery, params);
    return resultSets;
  });
  console.log(resultSets);
}

export async function getConnections(token: string) {
  const driver = await getYdbDriver(token);
  const query = `SELECT connectionId, topic, createdAt FROM connections`;
  const resultSets = await driver.tableClient.withSession(async session => {
    const { resultSets } = await session.executeQuery(query);
    return resultSets;
  });
  const rows = TypedData.createNativeObjects(resultSets[0]) as unknown as Connection[];
  return rows.length;
}

async function getYdbDriver(token: string) {
  ydbDriver = ydbDriver || new Driver({
    endpoint: YDB_ENDPOINT,
    database: YDB_PATH,
    authService: new TokenAuthService(token)
  });

  if (!await ydbDriver.ready(3000)) {
    console.log(`Driver has not become ready in allowed time!`);
    process.exit(1);
  }

  return ydbDriver;
}
