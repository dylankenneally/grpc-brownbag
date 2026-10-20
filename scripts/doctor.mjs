// @ts-check
/*
 * prerequisites checker: `npm run doctor`
 * - checks each tool the demos need, its version, and where to get it
 * - checks the demo ports are free
 * - exits non-zero when anything required is missing, so `npm run setup` stops early
 * uses only node built-ins so it works before `npm install` has run.
 */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { pathToFileURL } from 'node:url';

/** @typedef {'required' | 'recommended' | 'optional'} Level */

/**
 * @typedef {object} ToolCheck
 * @property {string} name display name
 * @property {Level} level how much the demos depend on it
 * @property {string} usedFor what breaks without it
 * @property {string} min minimum version (x.y.z)
 * @property {() => string | undefined} probe returns the installed version, or undefined if not found
 * @property {string[]} install where to get it
 */

/**
 * @typedef {object} PortCheck
 * @property {number} port
 * @property {string} usedFor
 */

/**
 * run a command and return its combined output, or undefined if it couldn't start.
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
        return undefined;
    }

    return `${result.stdout}${result.stderr}`;
}

/**
 * pull the first x.y.z out of some tool output.
 * @param {string | undefined} text
 */
function firstVersion(text) {
    return text?.match(/(\d+)\.(\d+)(?:\.(\d+))?/)?.[0];
}

/**
 * compare two dotted versions; negative when a < b.
 * @param {string} a
 * @param {string} b
 */
function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

// the highest installed .NET SDK, since `dotnet --version` reports whichever one global.json picks
function dotnetSdkVersion() {
    const sdks = run('dotnet', ['--list-sdks']);
    if (!sdks) {
        return undefined;
    }

    const versions = sdks
        .split(/\r?\n/)
        .map((line) => firstVersion(line))
        .filter((v) => v !== undefined);
    return versions.sort(compareVersions).at(-1);
}

/** @type {ToolCheck[]} */
const tools = [
    {
        name: 'Node.js',
        level: 'required',
        usedFor: 'npm scripts, TypeScript clients, tools and the browser demo',
        min: '22.13.0',
        probe: () => process.versions.node,
        install: ['https://nodejs.org/en/download (pick the LTS release)', 'macOS: brew install node@24'],
    },
    {
        name: '.NET SDK',
        level: 'required',
        usedFor: 'the C# lunch server and C# client',
        min: '10.0.100',
        probe: dotnetSdkVersion,
        install: ['https://dotnet.microsoft.com/download/dotnet/10.0', 'macOS: brew install --cask dotnet-sdk'],
    },
    {
        name: 'Go',
        level: 'recommended',
        usedFor: 'act 9 (polyglot): the Go server and client; setup fetches the Go modules and codegen plugins',
        min: '1.25.0',
        probe: () => firstVersion(run('go', ['version'])),
        install: ['https://go.dev/dl/', 'macOS: brew install go'],
    },
    {
        name: 'grpcurl',
        level: 'optional',
        usedFor: 'nothing; the scripts use `buf curl`, but grpcurl is the tool you will see in blog posts',
        min: '1.9.0',
        probe: () => firstVersion(run('grpcurl', ['--version'])),
        install: ['https://github.com/fullstorydev/grpcurl/releases', 'macOS: brew install grpcurl'],
    },
];

// ports sit below the OS dynamic range (Windows/Hyper-V reserves blocks above 49152) and avoid 5000/7000 (macOS AirPlay).
// keep in step with node/tools/src/shared/kitchen.ts, dotnet/Server/KitchenOptions.cs and web/vite.config.ts.
/** @type {PortCheck[]} */
const ports = [
    { port: 5051, usedFor: 'C# kitchen, native gRPC (HTTP/2)' },
    { port: 5080, usedFor: 'C# kitchen, gRPC-Web + REST (HTTP/1.1)' },
    { port: 5052, usedFor: 'Go food truck (act 9)' },
    { port: 5060, usedFor: 'round-robin proxy, gRPC (act 6)' },
    { port: 5061, usedFor: 'kitchen A, gRPC (act 6)' },
    { port: 5062, usedFor: 'kitchen B, gRPC (act 6)' },
    { port: 5070, usedFor: 'round-robin proxy, REST (act 6)' },
    { port: 5071, usedFor: 'kitchen A, REST (act 6)' },
    { port: 5072, usedFor: 'kitchen B, REST (act 6)' },
    { port: 5173, usedFor: 'browser page dev server (act 8)' },
];

/**
 * resolve true when nothing is listening on the port.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortFree(port) {
    return new Promise((resolve) => {
        const server = createServer();
        server.once('error', () => { resolve(false); });
        server.once('listening', () => { server.close(() => { resolve(true); }); });
        server.listen(port, '127.0.0.1');
    });
}

const marks = /** @type {const} */ ({ ok: '✅', warn: '⚠️ ', fail: '❌' });

/**
 * print the report and return true when every required tool is present and new enough.
 * @returns {Promise<boolean>}
 */
export async function runDoctor() {
    let healthy = true;
    console.log('\n🥪 gRPC brown bag: checking the kitchen is stocked...\n');

    for (const tool of tools) {
        const version = tool.probe();
        const tooOld = version !== undefined && compareVersions(version, tool.min) < 0;
        if (version && !tooOld) {
            console.log(`${marks.ok} ${tool.name} ${version}`);
            continue;
        }

        const problem = version ? `${version} is older than ${tool.min}` : 'not found';
        const mark = tool.level === 'required' ? marks.fail : marks.warn;
        console.log(`${mark} ${tool.name}: ${problem} (${tool.level}, used for ${tool.usedFor})`);
        for (const where of tool.install) {
            console.log(`     get it: ${where}`);
        }

        if (tool.level === 'required') {
            healthy = false;
        }
    }

    console.log('');
    for (const { port, usedFor } of ports) {
        const free = await isPortFree(port);
        // a busy port is usually a demo server you already started, so warn rather than fail
        console.log(free ? `${marks.ok} port ${port} free (${usedFor})` : `${marks.warn} port ${port} in use or reserved by the OS (${usedFor}); stop whatever is on it before the demo`);
    }

    console.log(healthy ? '\nAll required ingredients present. Bon appétit.\n' : '\nMissing required ingredients; install the ❌ items above and run `npm run doctor` again.\n');
    return healthy;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const healthy = await runDoctor();
    process.exitCode = healthy ? 0 : 1;
}
