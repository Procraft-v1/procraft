/** Application exceptions mirroring Procraft.Application.Common.Exceptions. */

export type FieldErrors = Record<string, string[]>;

export class AppValidationException extends Error {
  readonly errors: FieldErrors;

  constructor(errors: FieldErrors = {}) {
    super('Validation failed');
    this.errors = errors;
  }
}

export class ConflictException extends Error {
  readonly errors: FieldErrors;

  constructor(errors: FieldErrors = {}) {
    super('Conflict');
    this.errors = errors;
  }
}

export class UnauthorizedException extends Error {
  constructor(message = '') {
    super(message);
  }
}

export class NotFoundException extends Error {
  constructor(message = '') {
    super(message);
  }
}

export class PayloadTooLargeException extends Error {
  constructor(message = 'Request body too large.') {
    super(message);
  }
}
