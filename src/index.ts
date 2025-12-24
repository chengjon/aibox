#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './storage/config/config-manager';
import { PackageInstaller } from './core/installer/package-installer';
import { GitHubMarketplace } from './integrations/marketplaces/github-marketplace';
import { SQLiteAdapter } from './storage/database/sqlite-adapter';
import { createInstallCommand } from './interfaces/cli/commands/install';
import { createListCommand } from './interfaces/cli/commands/list';
import { createInitCommand } from './interfaces/cli/commands/init';
import { getDatabasePath, getAIBoxHome } from './core/paths';

const program = new Command();
const configManager = new ConfigManager(getAIBoxHome());

// Initialize marketplace and database adapter
const marketplace = new GitHubMarketplace('anthropic', 'agent-skills');
const dbAdapter = new SQLiteAdapter(getDatabasePath());
const installer = new PackageInstaller(marketplace, dbAdapter);

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
