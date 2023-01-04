import { Driver, TokenAuthService } from 'ydb-sdk';

const YDB_ENDPOINT = 'grpcs://ydb.serverless.yandexcloud.net:2135';
const YDB_PATH = process.env.YDB_PATH;
let ydbDriver: Driver;

export async function getConnectionId(topic: string, token: string) {
  const driver = await getYdbDriver(token);
  return '';
}

export async function saveConnectionId(topic: string, connectionId: string, token: string) {

}

export async function getConnections(token: string) {
  const driver = await getYdbDriver(token);
  return 0;
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
