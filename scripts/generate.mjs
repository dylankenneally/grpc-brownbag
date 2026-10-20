// @ts-check
/*
 * code generation: `npm run generate`
 * - TypeScript for the Node client, the Node tools and the browser page (buf.gen.yaml)
 * - TypeScript for each schema-evolution variant, one run per folder (evolution/buf.gen.yaml)
 * - Go, when Go is installed (buf.gen.go.yaml)
 * .NET isn't here: Grpc.Tools generates C# during `dotnet build`.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * run buf with the given arguments; throws when it fails.
 * @param {string[]} args
 */
function buf(args) {
    console.log(`  buf ${args.join(' ')}`);
    // shell resolves node_modules/.bin/buf(.cmd) on every OS; the arguments are fixed paths, never user input
    const result = spawnSync('buf', args, { shell: true, stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`[generate] buf ${args.join(' ')} failed (exit ${result.status ?? 'none'})`);
        throw new Error(`buf ${args.join(' ')} failed`);
    }
}

function hasGo() {
    return spawnSync('go', ['version']).status === 0;
}

console.log('🧬 generating TypeScript from proto/');
buf(['generate']);

console.log('🧬 generating TypeScript for each schema-evolution variant');
const variants = readdirSync('evolution').filter((name) => statSync(join('evolution', name)).isDirectory());
for (const variant of variants) {
    buf(['generate', `evolution/${variant}`, '--template', 'evolution/buf.gen.yaml', '--output', `node/tools/src/gen/evolution/${variant}`]);
}

if (hasGo()) {
    console.log('🧬 generating Go from proto/');
    buf(['generate', '--template', 'buf.gen.go.yaml']);
} else {
    console.log('⚠️  Go not found; skipping Go generation (only the polyglot demo needs it)');
}
