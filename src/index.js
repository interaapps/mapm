#!/usr/bin/env node
import { Command } from 'commander'

import { installCommands } from './commands/install.js'
import { uninstallCommands } from './commands/uninstall.js'
import { ImportMap } from './importmap.js'
import { MapmConfig } from './MapmConfig.js'
import { linkCommands } from './commands/link.js'

export const program = new Command();

export const config = new MapmConfig()

let importMap = undefined
export function getImportMap(fParam) {
    if (!importMap) {
        importMap = new ImportMap(fParam || config.config?.file || 'import-map.json')
    }

    return importMap
}

program
    .name('mapm')
    .description('Import Map Package Manager')
    .version('0.1.0');

installCommands()
uninstallCommands()
linkCommands()

program.parse();
