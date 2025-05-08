import { config } from './index.js'

export function versionToUrl(packageVersion, provider) {
    if (!provider) {
        provider = config.config?.provider
    }
    if (!provider) {
        provider = 'skypack'
    }

    const {name, version} = packageVersion
    if (provider === 'esm.sh') {
        return `https://esm.sh/${name}@${version}`;
    } if (provider === 'esm.run' || provider === 'jsdelivr') {
        return `https://esm.sh/${name}@${version}`;
    } else if (provider === 'unpkg') {
        return `https://unpkg.com/${name}@${version}?module`;
    } else if (provider === 'skypack') {
        return `https://cdn.skypack.dev/${name}@${version}`;
    }

    return provider
        .replace('{name}', name)
        .replace('{version}', version);
}