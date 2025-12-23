import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../../storage/config/config-manager';
import { PackageInstaller } from '../../../core/installer/package-installer';

export function createInstallCommand(configManager: ConfigManager, installer: PackageInstaller): Command {
  const cmd = new Command('install');

  cmd
    .argument('[name]', 'Component name with optional marketplace (name@marketplace)')
    .option('-s, --scope <scope>', 'Installation scope', 'user')
    .option('-f, --force', 'Force reinstall even if already installed')
    .option('--skip-deps', 'Skip dependency installation')
    .action(async (name, options) => {
      try {
        console.log(chalk.blue(`Installing ${name}...`));

        const [componentName, marketplace] = name.split('@');
        const component = await installer.install({
          name: componentName,
          marketplace: marketplace || 'default',
          scope: options.scope,
          force: options.force,
          skipDeps: options.skipDeps
        });

        console.log(chalk.green(`✓ Installed ${component.name} v${component.version}`));
      } catch (error: any) {
        console.error(chalk.red(`✗ Installation failed: ${error.message}`));
        process.exit(1);
      }
    });

  return cmd;
}
