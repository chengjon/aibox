/**
 * Component repository interface for data access abstraction
 *
 * This interface defines the contract for component storage operations,
 * enabling testability through mocking and supporting multiple storage backends.
 */

import { Component, ComponentType, Scope } from '../../types';

export interface ComponentRepository {
  /**
   * Initialize the repository (create tables, connections, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Add a component to the repository
   * @param component - The component to add
   */
  addComponent(component: Component): Promise<void>;

  /**
   * Get a component by ID
   * @param id - The component ID
   * @returns The component, or null if not found
   */
  getComponent(id: string): Promise<Component | null>;

  /**
   * List components with optional filtering
   * @param filter - Optional filters for type and scope
   * @returns Array of components matching the filter
   */
  listComponents(filter?: { type?: ComponentType; scope?: Scope }): Promise<Component[]>;

  /**
   * Remove a component by ID
   * @param id - The component ID to remove
   */
  removeComponent(id: string): Promise<void>;

  /**
   * Close the repository and release resources
   */
  close(): Promise<void>;
}
