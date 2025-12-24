import { Command } from 'commander';
import chalk from 'chalk';
import { SQLiteAdapter } from '../../../storage/database/sqlite-adapter';
import { getDatabasePath } from '../../../core/paths';

export function createListCommand(): Command {
  const cmd = new Command('list');

  cmd
    .option('-t, --type <type>', 'Filter by component type')
    .option('-s, --scope <scope>', 'Filter by scope', 'all')
    .action(async (options) => {
      const adapter = new SQLiteAdapter(getDatabasePath());
      await adapter.initialize();

      try {
        const components = await adapter.listComponents({
          type: options.type,
          scope: options.scope === 'all' ? undefined : options.scope
        });

        if (components.length === 0) {
          console.log(chalk.yellow('No components installed'));
          return;
        }

        // Display table
        console.log(chalk.cyan('Installed Components:'));
        for (const component of components) {
          console.log(`  ${chalk.green(component.name)} (${component.type}) v${component.version} [${component.scope}]`);
        }
      } finally {
        await adapter.close();
      }
    });

  return cmd;
}
