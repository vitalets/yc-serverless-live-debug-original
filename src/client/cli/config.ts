import path from 'node:path';
import { CloudHandler } from '../../helpers/cloud-request';
import { logger } from '../../helpers/logger';

const CONFIG_FILE = 'live-debug.config';

export interface LiveDebugConfig {
  handler: CloudHandler,
}

export function defineConfig(config: LiveDebugConfig) {
  return config;
}

export async function readConfig() {
  const configFile = path.resolve(CONFIG_FILE);
  logger.info(`Reading config: ${configFile}`);
  try {
    const config = await import(configFile);
    return config.default as LiveDebugConfig;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      logger.info('Config not found. Did you create it?');
      process.exit();
    } else {
      throw e;
    }
  }

}
