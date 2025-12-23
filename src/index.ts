#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('aibox')
  .description('Claude Code SACMP Management Tool')
  .version('0.1.0');

program
  .command('install [name]')
  .description('Install a SACMP component')
  .option('-s, --scope <scope>', 'Installation scope', 'user')
  .action((name, options) => {
    console.log('Installing:', name, 'Scope:', options.scope);
  });

program
  .command('list')
  .description('List installed components')
  .option('-t, --type <type>', 'Filter by type')
  .action(() => {
    console.log('Listing components...');
  });

// Export program for testing
export { program };

// Only parse if running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}
