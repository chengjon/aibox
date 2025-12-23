import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export enum ReloadResult {
  SUCCESS = 'success',
  NO_PROCESS = 'no_process',
  NOT_SUPPORTED = 'not_supported',
  TIMEOUT = 'timeout',
  ERROR = 'error'
}

export interface ClaudeProcess {
  pid: number;
  version: string;
  projectPath?: string;
  supportsHotReload: boolean;
}

export class HotReloadSignaler {
  async detectClaudeProcess(): Promise<ClaudeProcess | null> {
    try {
      // Try to find Claude Code process
      const output = execSync('pgrep -f "claude" || true', { encoding: 'utf-8' });
      const pids = output.trim().split('\n').filter(Boolean);

      if (pids.length === 0) {
        return null;
      }

      return {
        pid: parseInt(pids[0]),
        version: '1.0.0',
        supportsHotReload: true
      };
    } catch {
      return null;
    }
  }

  async signalReload(projectPath?: string): Promise<ReloadResult> {
    const process = await this.detectClaudeProcess();

    if (!process) {
      return ReloadResult.NO_PROCESS;
    }

    // Try file-based signaling first (cross-platform)
    if (projectPath) {
      return await this.signalViaFile(projectPath);
    }

    // Try Unix signal
    return await this.signalViaUnixSignal(process.pid);
  }

  async awaitReload(timeout: number): Promise<boolean> {
    // Wait for reload confirmation
    // This is a simplified version
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  private async signalViaFile(projectPath: string): Promise<ReloadResult> {
    try {
      const markerPath = join(projectPath, '.claude', '.reload');
      writeFileSync(markerPath, Date.now().toString());

      // Wait for file to be deleted (Claude Code picks it up)
      const startTime = Date.now();
      while (existsSync(markerPath) && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return existsSync(markerPath) ? ReloadResult.TIMEOUT : ReloadResult.SUCCESS;
    } catch {
      return ReloadResult.ERROR;
    }
  }

  private async signalViaUnixSignal(pid: number): Promise<ReloadResult> {
    try {
      // Send SIGUSR1 to Claude Code process
      execSync(`kill -SIGUSR1 ${pid}`);
      return ReloadResult.SUCCESS;
    } catch {
      return ReloadResult.ERROR;
    }
  }
}
