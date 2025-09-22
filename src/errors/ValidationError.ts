export class ValidationError extends Error {
  public readonly code: string;
  public readonly field: string | undefined;
  public readonly value?: any;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId: string | undefined;

  constructor(
    message: string,
    code: string = 'VALIDATION_ERROR',
    field?: string,
    value?: any,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.value = value;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  public toJSON(): object {
    return {
      error: true,
      type: this.name,
      message: this.message,
      code: this.code,
      field: this.field,
      value: this.value,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
    };
  }

  public static fromJoiError(joiError: any, requestId?: string): ValidationError {
    const firstError = joiError.details[0];
    return new ValidationError(
      firstError.message,
      'VALIDATION_ERROR',
      firstError.path.join('.'),
      firstError.context?.value,
      { joiError: joiError.details },
      requestId
    );
  }

  public static fromMultipleErrors(errors: string[], requestId?: string): ValidationError {
    return new ValidationError(
      'Multiple validation errors occurred',
      'MULTIPLE_VALIDATION_ERRORS',
      undefined,
      undefined,
      { errors },
      requestId
    );
  }
}
