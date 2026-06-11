import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

/** Serilog-style request completion logging: method, path, status, elapsed. No bodies. */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    logger.log(`HTTP ${req.method} ${req.originalUrl} responded ${res.statusCode} in ${elapsedMs.toFixed(1)} ms`);
  });

  next();
}
