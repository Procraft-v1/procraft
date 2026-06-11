import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  AppValidationException,
  ConflictException,
  FieldErrors,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
} from './exceptions';

/**
 * Mirrors Procraft.Api.Middleware.ExceptionHandlingMiddleware: identical JSON
 * payload shapes and status codes, camelCased leaf property keys in errors.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionHandling');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof AppValidationException) {
      response.status(400).json({
        message: 'Validation failed',
        errors: toCamelErrors(exception.errors),
      });
      return;
    }

    if (exception instanceof ConflictException) {
      response.status(409).json({
        message: 'Conflict',
        errors: toCamelErrors(exception.errors),
      });
      return;
    }

    if (exception instanceof UnauthorizedException) {
      response.status(401).json({ message: exception.message });
      return;
    }

    if (exception instanceof NotFoundException) {
      response.status(404).json({ message: exception.message });
      return;
    }

    if (exception instanceof PayloadTooLargeException) {
      response.status(413).json({ message: exception.message });
      return;
    }

    // Nest framework exceptions (404 route-not-found etc.) keep their status code.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 404) {
        response.status(404).json({ message: 'Not found.' });
        return;
      }
      if (status === 401) {
        response.status(401).json({ message: 'Not authenticated.' });
        return;
      }
      if (status === 413) {
        response.status(413).json({ message: 'Request body too large.' });
        return;
      }
      response.status(status).json({ message: exception.message });
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    response.status(500).json({ message: 'An unexpected error occurred.' });
  }
}

function toCamelErrors(errors: FieldErrors): FieldErrors {
  const result: FieldErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    result[camelLeaf(key)] = value;
  }
  return result;
}

function camelLeaf(key: string): string {
  const segments = key.split('.').filter((segment) => segment.length > 0);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : key;
  return leaf.length > 0 ? leaf[0].toLowerCase() + leaf.slice(1) : leaf;
}
