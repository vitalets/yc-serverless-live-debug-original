import fs from 'node:fs';
import path from 'node:path';
import { Construct } from 'constructs';
import { App, AssetType, TerraformAsset, TerraformOutput, TerraformStack } from 'cdktf';
import { YandexProvider } from '../.gen/providers/yandex/provider';
import { FunctionResource } from '../.gen/providers/yandex/function-resource';
import { IamServiceAccount } from '../.gen/providers/yandex/iam-service-account';
import { ResourcemanagerFolder } from '../.gen/providers/yandex/resourcemanager-folder';
import { ResourcemanagerFolderIamBinding } from '../.gen/providers/yandex/resourcemanager-folder-iam-binding';
import { ApiGateway } from '../.gen/providers/yandex/api-gateway';
import { YdbDatabaseServerless } from '../.gen/providers/yandex/ydb-database-serverless';

interface LiveDebugConfig {
  folderName: string;
}

function main() {
  const app = new App();
  new LiveDebugStack(app, 'live-debug', {
    folderName: 'live-debug-cdktf'
  });
  app.synth();
}

class LiveDebugStack extends TerraformStack {
  folder: ResourcemanagerFolder;
  sa: IamServiceAccount;

  constructor(scope: Construct, id: string, config: LiveDebugConfig) {
    super(scope, id);
    this.initProvider()
    this.folder = this.createFolder(config.folderName);
    this.sa = this.createSa();
    this.assignSaRoles();
    const ydb = this.createYdb();
    const zip = this.zipFnSources();
    const fnStub = this.createFnStub(zip, ydb);
    const fnStore = this.createFnStore(zip, ydb);
    const apigw = this.createApigw(fnStub, fnStore);
    this.createOutputs(apigw);
  }

  private initProvider() {
    new YandexProvider(this, 'provider', {
      token: process.env.YC_TOKEN,
      cloudId: process.env.YC_CLOUD_ID,
    });
  }

  private createFolder(name: string) {
    return new ResourcemanagerFolder(this, 'folder', { name });
  }

  private createSa() {
    return new IamServiceAccount(this, 'sa', {
      name: 'live-debug-sa-cdktf',
      description: 'Service account to manage live debug',
      folderId: this.folder.id,
    });
  }

  private assignSaRoles() {
    const roles = [
      'serverless.functions.invoker',
      'ydb.editor',
      'api-gateway.websocketWriter',
    ];
    roles.forEach(role => new ResourcemanagerFolderIamBinding(this, `sa-role-${role}`, {
      members: [ `serviceAccount:${this.sa.id}` ],
      folderId: this.folder.id,
      role,
    }));
  }

  private zipFnSources() {
    return new TerraformAsset(this, 'zip', {
      path: './dist',
      type: AssetType.ARCHIVE,
    });
  }

  private createFnStub(zip: TerraformAsset, ydb: YdbDatabaseServerless) {
    return new FunctionResource(this, 'fn-stub', {
      name: 'live-debug-stub',
      description: 'Function to proxy requests to local code',
      runtime: 'nodejs16',
      entrypoint: 'fn-stub.handler',
      memory: 128,
      executionTimeout: '60',
      folderId: this.folder.id,
      serviceAccountId: this.sa.id,
      userHash: zip.assetHash,
      content: {
        zipFilename: zip.path,
      },
      environment: {
        YDB_PATH: ydb.databasePath,
      },
    });
  }

  private createFnStore(zip: TerraformAsset, ydb: YdbDatabaseServerless) {
    return new FunctionResource(this, 'fn-store', {
      name: 'live-debug-store',
      description: 'Function to store ws connections in ydb',
      runtime: 'nodejs16',
      entrypoint: 'fn-store.handler',
      memory: 128,
      executionTimeout: '5',
      folderId: this.folder.id,
      serviceAccountId: this.sa.id,
      userHash: zip.assetHash,
      content: {
        zipFilename: zip.path,
      },
      environment: {
        YDB_PATH: ydb.databasePath,
      },
    });
  }

  private createApigw(fnStub: FunctionResource, fnStore: FunctionResource) {
    const specFile = path.resolve(__dirname, 'apigw.yaml');
    const name = 'live-debug-apigw';
    return new ApiGateway(this, 'gateway', {
      name,
      description: 'API gateway to hold WS connections and accept stub function requests',
      folderId: this.folder.id,
      spec: withParams(fs.readFileSync(specFile, 'utf8'), {
        apigw_name: name,
        stub_fn_id: fnStub.id,
        store_fn_id: fnStore.id,
        sa_id: this.sa.id,
      }),
    });
  }

  private createYdb() {
    return new YdbDatabaseServerless(this, 'ydb', {
      name: 'live-debug-db',
      folderId: this.folder.id,
    });
  }

  private createOutputs(apigw: ApiGateway) {
    new TerraformOutput(this, 'stubUrl', {
      value: `https://${apigw.domain}`,
    });
  }
}

main();

function withParams(template: string, obj: Record<string, unknown>) {
  return template.replace(/\${(.*?)}/g, (_, key) => String(obj[key]));
}
