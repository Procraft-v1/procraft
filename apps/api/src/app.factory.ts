import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import cookieParser = require('cookie-parser');
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { CookieService } from './auth/cookie.service';
import { csrfMiddleware, issueCsrfAfterAuthMiddleware } from './auth/csrf.middleware';
import { PasswordHasher } from './auth/password-hasher';
import { GlobalExceptionFilter } from './common/http-exception.filter';
import { requestLoggingMiddleware } from './common/request-logging.middleware';
import { getConfig } from './config/env';
import { runEfCompatibleMigrations } from './database/ef-migrations';
import { seedStaticAccount, seedTemplates } from './database/seed';

/**
 * Builds the fully configured application — middleware order mirrors the
 * ASP.NET pipeline (forwarded headers, logging, static uploads, CORS, auth,
 * CSRF, exception handling). Shared by main.ts and the e2e tests.
 */
export async function createConfiguredApp(): Promise<NestExpressApplication> {
  const config = getConfig();
  config.validate();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: ['log', 'warn', 'error'],
  });

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.set('trust proxy', true);
  expressApp.disable('x-powered-by');

  app.use(requestLoggingMiddleware);
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));
  app.use(cookieParser());

  const uploadsRoot = path.resolve(config.uploads.rootPath);
  fs.mkdirSync(uploadsRoot, { recursive: true });
  app.use(config.uploads.publicBasePath, express.static(uploadsRoot, { fallthrough: true }));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, false);
        return;
      }

      if (config.isDevelopment) {
        callback(null, config.corsDevelopmentOrigins.includes(origin));
        return;
      }

      callback(null, isAllowedProductionOrigin(origin, config.corsAllowedOrigins));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  const cookieService = new CookieService();
  app.use(csrfMiddleware);
  app.use(issueCsrfAfterAuthMiddleware(cookieService));

  app.useGlobalFilters(new GlobalExceptionFilter());

  if (config.isDevelopment) {
    const documentConfig = new DocumentBuilder()
      .setTitle('Procraft API')
      .setVersion('v1')
      .setDescription('Procraft backend gateway (cookie-based auth scaffolding, CSRF placeholders).')
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup('swagger', app, document);
  }

  return app;
}

/** Migrations + seeding, mirroring the Program.cs startup block. */
export async function runDatabaseStartup(app: NestExpressApplication, logger: Logger): Promise<void> {
  const config = getConfig();
  const dataSource = app.get(DataSource);

  await runEfCompatibleMigrations(dataSource, logger);
  await seedTemplates(dataSource);

  if (config.isDevelopment) {
    await seedStaticAccount(dataSource, new PasswordHasher(), logger);
  }

  logger.log('Database migrations and seeding completed successfully.');
}

export function isAllowedProductionOrigin(origin: string, configuredOrigins: string[]): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') {
    return false;
  }

  if (configuredOrigins.some((configured) => configured.toLowerCase() === origin.toLowerCase())) {
    return true;
  }

  const host = url.hostname.toLowerCase();
  return host === 'procraft.uz' || host.endsWith('.procraft.uz');
}
