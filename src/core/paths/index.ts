import { join, homedir } from 'path';
import { homedir as osHomedir } from 'os';

/**
 * Centralized path management for AIBox
 */

// Constants
export const AIBOX_HOME = join(homedir(), '.aibox');
export const CLAUDE_DIR = '.claude';

// Path getters
export function getHomeDir(): string {
  return osHomedir();
}

export function getAIBoxHome(): string {
  return AIBOX_HOME;
}

export function getDataDir(): string {
  return join(AIBOX_HOME, 'data');
}

export function getDatabasePath(): string {
  return join(getDataDir(), 'registry.db');
}

export function getComponentsDir(scope: 'user' | 'project' | 'local'): string {
  switch (scope) {
    case 'user':
      return join(AIBOX_HOME, 'components');
    case 'project':
      return join(process.cwd(), CLAUDE_DIR);
    case 'local':
      return join(process.cwd(), '.aibox', 'components');
    default:
      throw new Error(`Invalid scope: ${scope}`);
  }
}

export function getComponentPath(componentType: 'skills' | 'plugins' | 'commands' | 'agents' | 'mcp_servers', scope: 'user' | 'project' | 'local'): string {
  const baseDir = getComponentsDir(scope);
  if (scope === 'project') {
    return join(baseDir, componentType);
  }
  return join(baseDir, componentType);
}

export function getConfigPath(scope: 'global' | 'project'): string {
  if (scope === 'global') {
    return join(AIBOX_HOME, 'config.yaml');
  }
  return join(process.cwd(), CLAUDE_DIR, 'aibox-project.yaml');
}

export function getProjectClaudeDir(): string {
  return join(process.cwd(), CLAUDE_DIR);
}

export function getHotReloadMarkerPath(projectPath?: string): string {
  if (projectPath) {
    return join(projectPath, CLAUDE_DIR, '.reload');
  }
  return join(process.cwd(), CLAUDE_DIR, '.reload');
}

export function expandTilde(path: string): string {
  if (path.startsWith('~')) {
    return join(homedir(), path.slice(1));
  }
  return path;
}
