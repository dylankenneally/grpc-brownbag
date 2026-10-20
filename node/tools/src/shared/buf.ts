/*
 * runs the Buf CLI that npm installed, so the tools never depend on a global install.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { repoRoot } from './kitchen.js';

const require = createRequire(import.meta.url);

// the npm package ships a small node launcher for the platform's buf binary
const launcher = resolve(dirname(require.resolve('@bufbuild/buf/package.json')), 'bin/buf');

/** the outcome of one buf run. */
export interface BufResult {
    readonly ok: boolean;
    readonly output: string;
}

/** runs buf from the repo root and returns what it printed. */
export function buf(args: readonly string[]): BufResult {
    const result = spawnSync(process.execPath, [launcher, ...args], { cwd: repoRoot, encoding: 'utf8' });
    if (result.error) {
        console.error(`[tools] couldn't start buf: ${result.error.message}`);
        throw result.error;
    }

    return { ok: result.status === 0, output: `${result.stdout}${result.stderr}`.trim() };
}

/** the command as the audience would type it, for printing above its output. */
export function bufCommandLine(args: readonly string[]): string {
    return `buf ${args.map((x) => (/[\s{}"]/.test(x) ? `'${x}'` : x)).join(' ')}`;
}
