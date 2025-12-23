/**
 * Component type definitions for AIBox SACMP management
 */

export type ComponentType = 'skill' | 'plugin' | 'command' | 'agent' | 'mcp_server';
export type Scope = 'user' | 'project' | 'local';
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
