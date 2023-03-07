/**
 * Run live debug.
 *
 * Dev command:
 * npm run example:run
 */
import fs from 'node:fs';
import path from 'node:path';
import { LiveDebugStackOutputs } from '../cdktf/main';
import { runLocalClient } from '..';
import { readConfig } from './config';
import { logger } from '../../helpers/logger';

export default async function () {
  const config = await readConfig();
  const outputs = await readStackOutputs();
  logger.info(`Running local client...`);
  await runLocalClient({
    stubId: outputs.stubId,
    wsHost: outputs.apigwHost,
    handler: config.handler,
  });

  // TODO: watch changes
}

async function readStackOutputs() {
  const outputsFile = path.resolve('.live-debug', 'outputs.json');
  if (!fs.existsSync(outputsFile)) {
    logger.info(`Outputs file not found: ${outputsFile}`);
    logger.info(`Did you run "npx live-debug deploy"?`);
    process.exit();
  }
  const outputs = await import(outputsFile);
  return outputs['live-debug'] as LiveDebugStackOutputs;
}
