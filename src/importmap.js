import fs from 'fs'
import * as cheerio from 'cheerio'
import beautify from 'js-beautify'
import { versionToUrl } from './version-to-url.js'
import { NodePackage } from './nodeclient.js'
import chalk from 'chalk'
import semver from 'semver'
import { config } from './index.js'

export class ImportMap {
    constructor(fileName = 'import-map.json') {
        this.fromHtml = fileName.endsWith('.html') || fileName.endsWith('.htm') || fileName.endsWith('.shtml') || fileName.endsWith('.xhtml');
        this.fileName = fileName;

        if (!fs.existsSync(fileName)) {
            this.map = {};
            return;
        }

        const file = fs.readFileSync(fileName, 'utf-8');

        if (this.fromHtml) {
            this.cheerioInstance = cheerio.load(file);
            if (this.cheerioInstance('script[type="importmap"]').length) {
                const script = this.cheerioInstance('script[type="importmap"]').html();
                this.map = JSON.parse(script);
            } else {
                this.map = {};
            }
            return;
        }

        if (!file) {
            this.map = {};
            return;
        }

        this.map = JSON.parse(file);
    }

    async addPackage(packageVersion, provider = '', spinner = undefined) {
        if (!('imports' in this.map)) {
            this.map.imports = {};
        }

        // Recursively add dependencies
        if ('dependencies' in packageVersion) {
            for (const [depName, depRange] of Object.entries(packageVersion.dependencies)) {
                const depPackage = await NodePackage.from(depName);
                const depResolved = depPackage.getVersion(depRange);
                if (depResolved) {
                    await this.addPackage(depResolved, provider);
                }
            }
        }

        const name = packageVersion.name;
        const version = packageVersion.version;
        const url = versionToUrl(packageVersion, provider);

        // Skip if same or newer version already present
        const existingUrl = this.map.imports[name];
        if (existingUrl) {
            const match = existingUrl.match(/@([^@/]+)(\/|$)/);
            const existingVersion = match?.[1];
            if (
                existingVersion &&
                semver.valid(existingVersion) &&
                semver.gte(existingVersion, version)
            ) {
                spinner?.info(`${chalk.yellow(name)} is already at ${chalk.cyan(existingVersion)} (>= ${version})`);
                return existingUrl;
            }
        }

        this.map.imports[name] = url;
        this.map.imports[`${name}/`] = `${url}/`;
        //this.map.imports[`${name}@${version}`] = url;
        //this.map.imports[`${name}@${version}/`] = `${url}/`;

        spinner?.succeed(`Added ${chalk.green(name)} -> ${chalk.underline(url)} to import map.`);
        return url;
    }

    removePackage(name) {
        if (!('imports' in this.map)) return
        delete this.map.imports[name];
    }

    getPackage(name) {
        return this.map.imports?.[name];
    }

    listPackages() {
        return Object.entries(this.map.imports).map(([name, url]) => `${name}: ${url}`);
    }

    save() {
        const json = JSON.stringify(this.map, null, 2)
        if (this.fromHtml) {
            if (this.cheerioInstance('script[type="importmap"]').length) {
                this.cheerioInstance('script[type="importmap"]').html(json)
            } else {
                this.cheerioInstance('head').append(
                    `<script type="importmap">
    ${json}
</script>`
                );
            }

            let html = this.cheerioInstance.html()

            if (!config.config?.html?.disableBeautify) {
                html = beautify.html(html, {
                    preserve_newlines: false,
                    max_preserve_newlines: 1,
                    indent_size: config.config?.html?.indentSize || 2,
                    indent_inner_html: true
                })
            }
            fs.writeFileSync(this.fileName, html);
            return;
        }
        fs.writeFileSync(this.fileName, json);
    }
}