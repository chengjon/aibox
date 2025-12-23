/**
 * Migration type definitions for AIBox
 */

import { ComponentType, Dependency } from './component.types';

export interface MigrationPlan {
  componentId: string;
  fromProject: string;
  toProject: string;
  conflicts: Conflict[];
  missingDependencies: Dependency[];
  requiredChanges: string[];
  canProceed: boolean;
}

export interface Conflict {
  type: 'name' | 'dependency' | 'config';
  severity: 'error' | 'warning' | 'info';
  message: string;
  resolution?: string;
}

export interface MigrationResult {
  migrationId: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface MigrationOptions {
  overwrite?: boolean;
  skipConflicts?: boolean;
  keepSource?: boolean;
}
