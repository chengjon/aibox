import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../../storage/config/config-manager';
import { PackageInstaller } from '../../../core/installer/package-installer';

export function createInstallCommand(configManager: ConfigManager, installer: PackageInstaller): Command {
  const cmd = new Command('install');

  cmd
    .argument('[name]', 'Component name with optional marketplace (name@marketplace)')
    .option('-s, --scope <scope>', 'Installation scope', 'global')
    .option('-f, --force', 'Force reinstall even if already installed')
    .action(async (name, options) => {
      try {
        // Validate input
        if (!name || name.trim() === '') {
          console.error(chalk.red('Error: Component name is required'));
          console.log(chalk.dim('\nUsage: aibox install <name[@marketplace]> [options]'));
          console.log(chalk.dim('\nExamples:'));
          console.log(chalk.dim('  aibox install pdf-processing'));
          console.log(chalk.dim('  aibox install pdf-processing@anthropic-agent-skills'));
          process.exit(1);
        }

        const parts = name.trim().split('@');
        const componentName = parts[0];
        const marketplace = parts[1] || 'default';

        if (!componentName || componentName.trim() === '') {
          console.error(chalk.red('Error: Invalid component name'));
          process.exit(1);
        }

        console.log(chalk.blue(`Installing ${componentName} from ${marketplace}...`));

        const component = await installer.install({
          name: componentName,
          marketplace: marketplace,
          scope: options.scope,
          force: options.force
        });

        console.log(chalk.green(`✓ Installed ${component.name} v${component.version}`));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`✗ Installation failed: ${errorMessage}`));
        process.exit(1);
      }
    });

  return cmd;
}
