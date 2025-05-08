import ora from 'ora'
import chalk from 'chalk'
import { getImportMap, program } from '../index.js'
import { NodePackage } from '../nodeclient.js'
import { versionToUrl } from '../version-to-url.js'

export function installCommands() {
    program
        .command('install')
        .alias('i')
        .alias('add')
        .argument('<package>', 'Package to install (e.g. react@18)')
        .option('-r, --registry <url>', 'CDN registry base URL')
        .option('-f, --file <filename>', 'File Name (.html or .json)')
        .description('Install a package into the import map')
        .action(async (pkg, options) => {
            const importMap = getImportMap(options.file);
            const spinner = ora(`Installing ${chalk.cyan(pkg)}...`).start();

            try {
                // Split package name and version (e.g., react@18.2.0)
                const [pkgName, pkgVersion] = pkg.includes('@') && !pkg.startsWith('@')
                    ? pkg.split('@')
                    : [pkg, undefined]; // handle scoped packages like @types/node

                const nodePackage = await NodePackage.from(pkgName);
                const resolvedVersion = nodePackage.getVersion(pkgVersion || 'latest');

                if (!resolvedVersion) {
                    spinner.fail(`Could not resolve version: ${pkgVersion}`)
                    return;
                }

                await importMap.addPackage(resolvedVersion, options.registry, spinner);
                importMap.save();
                spinner?.succeed(`Installed ${chalk.green(pkg)} into ${importMap.fileName}.`);
            } catch (err) {
                spinner?.fail(`Failed to install: ${chalk.red(err.message)}`);
            }
        });

}