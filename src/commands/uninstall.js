import ora from 'ora'
import chalk from 'chalk'
import { getImportMap, program } from '../index.js'

export function uninstallCommands() {
    program
        .command('uninstall')
        .alias('rm')
        .argument('<package>', 'Package to remove from the import map')
        .description('Uninstall a package from the import map')
        .option('-f, --file <filename>', 'File Name (.html or .json)')
        .action(async (pkg, options) => {
            const importMap = getImportMap(options.file)
            const spinner = ora(`Uninstalling ${chalk.cyan(pkg)}...`).start();

            try {
                importMap.removePackage(pkg)
                importMap.save()
                spinner.succeed(`Removed ${chalk.green(pkg)} from import map.`);
            } catch (err) {
                spinner.fail(`Failed to uninstall: ${chalk.red(err.message)}`);
            }
        });
}