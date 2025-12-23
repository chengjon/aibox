/**
 * Utility type definitions for AIBox
 */

import { Component } from './component.types';

/**
 * Partial update type for Component (immutable id and installedAt)
 */
export type ComponentUpdate = Partial<Omit<Component, 'id' | 'installedAt'>>;

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };
