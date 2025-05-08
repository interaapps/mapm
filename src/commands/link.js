import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import * as cheerio from 'cheerio'
import { simple as walk } from 'acorn-walk'
import { parse } from 'acorn'

import { getImportMap, program } from '../index.js'
import { NodePackage } from '../nodeclient.js'
import { glob } from 'glob'

export function linkCommands() {
    program
        .command('link')
        .alias('l')
        .argument('<file...>', 'HTML or JS files to scan')
        .option('-o, --ouputfile <filename>', 'Import map file (.html or .json)')
        .option('-r, --registry <url>', 'CDN registry base URL')
        .description('Scan JS/HTML files for import statements and install packages')
        .action(async (files, options) => {
            const importMap = getImportMap(options.ouputfile)
            const foundPackages = new Set()

            const allFiles = files.flatMap((pattern) => glob.sync(pattern, { nodir: true }))
            for (const file of allFiles) {
                const ext = path.extname(file)
                const content = fs.readFileSync(file, 'utf-8')

                if (ext === '.js') {
                    extractImportsFromJS(content, foundPackages)
                } else if (ext === '.html') {
                    extractImportsFromHTML(content, foundPackages)
                }
            }

            const spinner = ora(`Installing ${foundPackages.size} packages...`).start()

            try {
                for (const specifier of foundPackages) {
                    const [name, version] = parseSpecifier(specifier)
                    console.log(name, version)
                    const nodePackage = await NodePackage.from(name)
                    const resolved = nodePackage.getVersion(version)
                    if (!resolved) continue
                    await importMap.addPackage(resolved, options.registry, spinner)
                }

                importMap.save()
                spinner?.succeed(`Installed ${foundPackages.size} packages to ${importMap.fileName}`)
            } catch (err) {
                spinner?.fail(`Failed: ${chalk.red(err.message)}`)
            }
        })
}

function parseSpecifier(specifier) {
    if (specifier.startsWith('@')) {
        const [scope, name, ...rest] = specifier.split('/')
        const version = rest.join('/').split('@')[1]
        return [`${scope}/${name}`, version]
    } else if (specifier.includes('@')) {
        const [name, version] = specifier.split('@')
        return [name.split('/')[0], version]
    } else {
        return [specifier.split('/')[0], undefined]
    }
}

function extractImportsFromJS(jsContent, foundPackages) {
    try {
        const ast = parse(jsContent, { sourceType: 'module', ecmaVersion: 'latest' })
        walk(ast, {
            ImportDeclaration(node) {
                const source = node.source.value
                if (isPackageImport(source)) {
                    foundPackages.add(source)
                }
            }
        })
    } catch (e) {
        console.warn(chalk.yellow('Failed to parse JS:'), e.message)
    }
}

function extractImportsFromHTML(htmlContent, foundPackages) {
    const $ = cheerio.load(htmlContent)
    $('script[type="module"]').each((_, el) => {
        const js = $(el).html()
        extractImportsFromJS(js, foundPackages)
    })
}

function isPackageImport(specifier) {
    return (
        typeof specifier === 'string' &&
        !specifier.startsWith('.') &&
        !specifier.startsWith('/') &&
        !specifier.startsWith('http')
    )
}
