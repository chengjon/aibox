/**
 * Component type definitions for AIBox SACMP management
 */

export type ComponentType = 'skill' | 'plugin' | 'command' | 'agent' | 'mcp_server';
export type Scope = 'global' | 'project' | 'local';
export type SourceType = 'marketplace' | 'git' | 'local' | 'url';

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  version: string;
  description: string;
  source: Source;
  metadata: Record<string, unknown>;
  scope: Scope;
  projectPath?: string;
  installedAt: Date;
  enabled: boolean;
  dependencies: Dependency[];
}

export interface Source {
  type: SourceType;
  location: string;
  ref?: string;
  marketplace?: string;
}

export interface Dependency {
  type: 'python' | 'node' | 'binary' | 'component';
  spec: string;
  optional?: boolean;
}

export interface InstalledComponent extends Component {
  path: string;
  symlink?: string;
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface MarketplaceMetadata {
  name: string;
  owner: {
    name: string;
    email?: string;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
  plugins: MarketplacePlugin[];
}

export interface MarketplacePlugin {
  name: string;
  source: string | MarketplaceSource;
  description?: string;
  version?: string;
  author?: {
    name: string;
  };
  skills?: string[];
}

export interface MarketplaceSource {
  source: 'github' | 'git' | 'url';
  repo?: string;
  url?: string;
}

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  keywords: string[];
  dependencies?: Dependency[];
  size?: number;
}

export interface ListOptions {
  type?: ComponentType;
  enabled?: boolean;
}

export interface SearchFilters {
  type?: ComponentType;
  keyword?: string;
  author?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

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
    ['global', 'project', 'local'].includes(value);
}

/**
 * Check if a value is a valid SourceType
 */
export function isSourceType(value: unknown): value is SourceType {
  return typeof value === 'string' &&
    ['marketplace', 'git', 'local', 'url'].includes(value);
}
