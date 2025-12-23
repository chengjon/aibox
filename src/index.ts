#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './storage/config/config-manager';
import { PackageInstaller } from './core/installer/package-installer';
import { createInstallCommand } from './interfaces/cli/commands/install';
import { createListCommand } from './interfaces/cli/commands/list';
import { createInitCommand } from './interfaces/cli/commands/init';

const program = new Command();
const configManager = new ConfigManager('~/.aibox');
const installer = new PackageInstaller();

program
  .name('aibox')
  .description('Claude Code SACMP Management Tool')
  .version('0.1.0');

// Add commands
program.addCommand(createInstallCommand(configManager, installer));
program.addCommand(createListCommand());
program.addCommand(createInitCommand());

// Export program for testing
export { program };

// Only parse if running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}
