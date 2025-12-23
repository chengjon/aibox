/**
 * Type guard functions for runtime type validation
 */

import { ComponentType, Scope, SourceType } from './component.types';

/**
 * Check if a value is a valid ComponentType
 */
export function isComponentType(value: unknown): value is ComponentType {
  return typeof value === 'string' &&
    ['skill', 'plugin', 'command', 'agent', 'mcp_server'].includes(value);
}

/**
 * Check if a value is a valid Scope
 */
export function isScope(value: unknown): value is Scope {
  return typeof value === 'string' &&
    ['user', 'project', 'local'].includes(value);
}

/**
 * Check if a value is a valid SourceType
 */
export function isSourceType(value: unknown): value is SourceType {
  return typeof value === 'string' &&
    ['marketplace', 'git', 'local', 'url'].includes(value);
}
