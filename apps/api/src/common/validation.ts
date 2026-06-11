import { AppValidationException, FieldErrors } from './exceptions';

/**
 * Minimal FluentValidation-compatible rule engine. Produces the exact default
 * message templates and PascalCase display-name splitting that the C# backend
 * emitted, so 400 payloads stay byte-compatible for the frontend.
 */

/** "EmailOrUsername" -> "Email Or Username" (FluentValidation display name). */
export function displayName(propertyName: string): string {
  return propertyName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
}

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

type Value = unknown;

export class RuleBuilder {
  private readonly failures: string[] = [];
  private lastMessageIndex = -1;

  constructor(
    private readonly property: string,
    private readonly value: Value,
  ) {}

  private get display(): string {
    return displayName(this.property);
  }

  private fail(message: string): void {
    this.failures.push(message);
    this.lastMessageIndex = this.failures.length - 1;
  }

  /** FluentValidation .WithMessage replaces the message of the last failed-or-not rule. */
  withMessage(message: string): this {
    if (this.lastMessageIndex >= 0 && this.lastMessageIndex === this.failures.length - 1 && this.pendingOverride) {
      this.failures[this.lastMessageIndex] = message;
    }
    this.pendingOverride = false;
    return this;
  }

  private pendingOverride = false;

  private ruleFailed(message: string): void {
    this.fail(message);
    this.pendingOverride = true;
  }

  private rulePassed(): void {
    this.pendingOverride = false;
  }

  notEmpty(): this {
    const v = this.value;
    const empty =
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim().length === 0) ||
      (typeof v === 'string' && v === EMPTY_GUID.toLowerCase()) ||
      v === EMPTY_GUID;

    if (empty) {
      this.ruleFailed(`'${this.display}' must not be empty.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  notNull(): this {
    if (this.value === null || this.value === undefined) {
      this.ruleFailed(`'${this.display}' must not be null.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  emailAddress(): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    const s = String(v);
    // FluentValidation AspNetCoreCompatible mode: exactly one '@', not at the ends.
    const at = s.indexOf('@');
    const valid = at > 0 && at === s.lastIndexOf('@') && at < s.length - 1;
    if (!valid) {
      this.ruleFailed(`'${this.display}' is not a valid email address.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  minimumLength(min: number): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    const length = String(v).length;
    if (length < min) {
      this.ruleFailed(
        `The length of '${this.display}' must be at least ${min} characters. You entered ${length} characters.`,
      );
    } else {
      this.rulePassed();
    }
    return this;
  }

  maximumLength(max: number): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    const length = String(v).length;
    if (length > max) {
      this.ruleFailed(
        `The length of '${this.display}' must be ${max} characters or fewer. You entered ${length} characters.`,
      );
    } else {
      this.rulePassed();
    }
    return this;
  }

  matches(pattern: RegExp): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    if (!pattern.test(String(v))) {
      this.ruleFailed(`'${this.display}' is not in the correct format.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  must(predicate: (value: Value) => boolean): this {
    if (!predicate(this.value)) {
      this.ruleFailed(`The specified condition was not met for '${this.display}'.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  greaterThan(comparison: number): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    if (!(Number(v) > comparison)) {
      this.ruleFailed(`'${this.display}' must be greater than '${comparison}'.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  lessThanOrEqualTo(comparison: number): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    if (!(Number(v) <= comparison)) {
      this.ruleFailed(`'${this.display}' must be less than or equal to '${comparison}'.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  /** A GUID property bound from JSON: invalid uuid strings fail format validation. */
  guid(): this {
    const v = this.value;
    if (v === null || v === undefined) {
      this.rulePassed();
      return this;
    }
    if (!isUuid(String(v))) {
      this.ruleFailed(`'${this.display}' is not in the correct format.`);
    } else {
      this.rulePassed();
    }
    return this;
  }

  getFailures(): string[] {
    return this.failures;
  }
}

export class Validator {
  private readonly errors: FieldErrors = {};

  ruleFor(property: string, value: Value): RuleBuilder {
    const builder = new RuleBuilder(property, value);
    this.pending.push({ property, builder });
    return builder;
  }

  private readonly pending: Array<{ property: string; builder: RuleBuilder }> = [];

  addFailure(property: string, message: string): void {
    (this.errors[property] ??= []).push(message);
  }

  /** Collects failures grouped by property name (C# ValidationBehavior semantics). */
  throwIfInvalid(): void {
    for (const { property, builder } of this.pending) {
      for (const failure of builder.getFailures()) {
        this.addFailure(property, failure);
      }
    }
    this.pending.length = 0;

    if (Object.keys(this.errors).length > 0) {
      throw new AppValidationException(this.errors);
    }
  }
}
