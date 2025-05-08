import semver from 'semver'

export class NodePackage {
    constructor(name) {
        this.url = `https://registry.npmjs.org/${name}`;
    }

    async fetch() {
        this.package = await (await fetch(this.url)).json();
    }

    getVersion(range = 'latest') {
        if (!range) range = 'latest';
        const distTags = this.package['dist-tags'] || {};
        const versions = Object.keys(this.package.versions || {});

        // Handle dist-tags like "latest", "next", etc.
        if (range in distTags) {
            range = distTags[range];
        }

        // Exact match
        if (this.package.versions[range]) {
            return this.package.versions[range];
        }

        // Resolve semver range like ^, ~, >=, etc.
        const matched = semver.maxSatisfying(versions, range);
        if (matched) {
            return this.package.versions[matched];
        }

        return undefined;
    }

    static async from(name) {
        const np = new NodePackage(name);
        await np.fetch()
        return np;
    }
}