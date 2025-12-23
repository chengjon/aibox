import { Command } from 'commander';
import chalk from 'chalk';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd.action(async () => {
    const claudeDir = join(process.cwd(), '.claude');

    if (existsSync(claudeDir)) {
      console.log(chalk.yellow('.claude directory already exists'));
      return;
    }

    // Create directory structure
    mkdirSync(join(claudeDir, 'skills'), { recursive: true });
    mkdirSync(join(claudeDir, 'commands'), { recursive: true });
    mkdirSync(join(claudeDir, 'agents'), { recursive: true });

    // Create project config
    const config = {
      project: {
        name: 'aibox-project',
        version: '0.1.0'
      },
      lock: {
        skills: [],
        plugins: [],
        commands: [],
        agents: [],
        mcpServers: []
      },
      settings: {
        autoSync: true,
        hotReload: true,
        scope: 'project'
      }
    };

    writeFileSync(
      join(claudeDir, 'aibox-project.yaml'),
      yaml.dump(config)
    );

    console.log(chalk.green('✓ Project initialized'));
    console.log(chalk.dim('Created .claude directory structure'));
  });

  return cmd;
}
