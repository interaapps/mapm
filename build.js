import { build } from 'esbuild';

await build({
    entryPoints: ['./src/index.js'],   // Your CLI entry file
    bundle: true,
    platform: 'node',
    outfile: 'dist/mapm.cjs',
    banner: {
        // js: '#!/usr/bin/env node',
    },

    format: 'cjs',
    target: ['node18'],
});