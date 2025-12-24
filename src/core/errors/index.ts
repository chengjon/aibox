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
 * Configuration-related errors
 */
export class ConfigError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', details);
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
 * Marketplace-related errors
 */
export class MarketplaceError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MARKETPLACE_ERROR', details);
  }
}

/**
 * Installation-related errors
 */
export class InstallationError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INSTALLATION_ERROR', details);
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AIBoxError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', details);
  }
}
