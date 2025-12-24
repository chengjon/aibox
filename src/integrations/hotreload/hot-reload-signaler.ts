import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';
import { getHotReloadMarkerPath } from '../../core/paths';

// Constants for timeout and polling intervals
const SIGNAL_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 100;
const AWAIT_RELOAD_DELAY_MS = 1000;

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
      if (platform() === 'win32') {
        // Windows: Use tasklist to find node.exe processes
        let output: string;
        try {
          output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH', { encoding: 'utf-8' });
        } catch (error) {
          // tasklist command failed - return null instead of throwing
          return null;
        }

        const lines = output.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const pid = parseInt(parts[1].replace(/"/g, '').trim());
            if (!isNaN(pid)) {
              return {
                pid,
                version: '1.0.0',
                supportsHotReload: true
              };
            }
          }
        }
        return null;
      } else {
        // Unix/Linux/macOS: Use pgrep
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
      }
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

    // Try platform-specific signaling
    return await this.signalViaProcessSignal(process.pid);
  }

  async awaitReload(timeout: number): Promise<boolean> {
    // Wait for reload confirmation
    // This is a simplified version
    await new Promise(resolve => setTimeout(resolve, AWAIT_RELOAD_DELAY_MS));
    return true;
  }

  private async signalViaFile(projectPath: string): Promise<ReloadResult> {
    const markerPath = getHotReloadMarkerPath(projectPath);

    try {
      // Write marker file
      writeFileSync(markerPath, Date.now().toString());

      // Wait for file to be deleted (Claude Code picks it up)
      const startTime = Date.now();
      while (existsSync(markerPath) && Date.now() - startTime < SIGNAL_TIMEOUT_MS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      // Clean up marker file if it still exists (timeout case)
      if (existsSync(markerPath)) {
        try {
          const { unlinkSync } = require('fs');
          unlinkSync(markerPath);
        } catch {
          // Ignore cleanup errors
        }
        return ReloadResult.TIMEOUT;
      }

      return ReloadResult.SUCCESS;
    } catch {
      return ReloadResult.ERROR;
    }
  }

  private async signalViaProcessSignal(pid: number): Promise<ReloadResult> {
    try {
      if (platform() === 'win32') {
        // Windows: Use taskkill to send a signal
        // Note: Windows doesn't support Unix signals, so we use a workaround
        execSync(`taskkill /PID ${pid} /SIGINT`, { stdio: 'pipe' });
        return ReloadResult.SUCCESS;
      } else {
        // Unix/Linux/macOS: Send SIGUSR1 to Claude Code process
        execSync(`kill -SIGUSR1 ${pid}`);
        return ReloadResult.SUCCESS;
      }
    } catch {
      return ReloadResult.ERROR;
    }
  }
}
