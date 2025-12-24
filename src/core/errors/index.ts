/**
 * Base error class for all AIBox errors
 */
export class AIBoxError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Component not found errors
 */
export class ComponentNotFoundError extends AIBoxError {
  constructor(componentName: string, marketplace?: string) {
    super(
      `Component "${componentName}" not found${marketplace ? ` in marketplace "${marketplace}"` : ''}`,
      'COMPONENT_NOT_FOUND',
      { componentName, marketplace }
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Installation-related errors (includes marketplace operations)
 */
export class InstallationError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INSTALLATION_ERROR', details);
  }
}
