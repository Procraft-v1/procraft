import 'reflect-metadata';
import { loadEnvironmentFile, getConfig } from './config/env';

// Mirror the ASP.NET host: .env discovery happens before anything reads config.
loadEnvironmentFile();

import { Logger } from '@nestjs/common';
import { createConfiguredApp, runDatabaseStartup } from './app.factory';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const config = getConfig();

  const app = await createConfiguredApp();

  try {
    await runDatabaseStartup(app, logger);
  } catch (error) {
    logger.error(
      'Database migration or seeding failed. Check DATABASE_URL configuration.',
      error instanceof Error ? error.stack : String(error),
    );
    throw error;
  }

  await app.listen(config.port, '0.0.0.0');
  logger.log(`Starting Procraft API host on port ${config.port} (${config.environment})`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', error);
  process.exit(1);
});
