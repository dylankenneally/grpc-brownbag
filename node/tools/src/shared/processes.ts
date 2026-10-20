/*
 * starting and stopping the extra processes some acts need (extra kitchens, the Go food truck).
 */
import { type ChildProcess, spawn, type SpawnOptions } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

/** resolves true if something accepts TCP connections on the localhost port. */
export function isListening(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = connect({ port, host: 'localhost' });
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => {
            resolve(false);
        });
    });
}

/** fails fast, with the command to fix it, when a server the act relies on isn't running. */
export async function requireListening(port: number, startWith: string): Promise<void> {
    if (!(await isListening(port))) {
        console.error(`[tools] nothing is listening on port ${port}; start it first with \`${startWith}\` in another terminal`);
        throw new Error(`nothing listening on port ${port}`);
    }
}

/** fails fast when a build output is missing, with the command that creates it. */
export function requireFile(path: string, createWith: string): void {
    if (!existsSync(path)) {
        console.error(`[tools] ${path} doesn't exist; run \`${createWith}\` first`);
        throw new Error(`missing ${path}`);
    }
}

/** a background process the act started and must stop. */
export interface Background {
    readonly name: string;
    stop(): void;
}

/**
 * starts a long-running process and waits until it listens on the port.
 * its output is dropped unless a line matches `echo`, so the audience only sees the lines that matter.
 */
export async function startBackground(options: { name: string; command: string; args: readonly string[]; port: number; cwd?: string; echo?: RegExp }): Promise<Background> {
    if (await isListening(options.port)) {
        console.error(`[tools] port ${options.port} is already in use; stop whatever is on it before starting ${options.name}`);
        throw new Error(`port ${options.port} already in use`);
    }

    const spawnOptions: SpawnOptions = { stdio: ['ignore', 'pipe', 'pipe'], ...(options.cwd ? { cwd: options.cwd } : {}) };
    const child: ChildProcess = spawn(options.command, options.args, spawnOptions);
    const forward = (chunk: Buffer) => {
        for (const line of chunk.toString().split(/\r?\n/)) {
            if (options.echo?.test(line)) {
                console.log(`   [${options.name}] ${line}`);
            }
        }
    };
    child.stdout?.on('data', forward);
    child.stderr?.on('data', forward);

    for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) {
            console.error(`[tools] ${options.name} exited with code ${child.exitCode} before it started listening`);
            throw new Error(`${options.name} exited early`);
        }

        if (await isListening(options.port)) {
            return { name: options.name, stop: () => child.kill() };
        }

        await sleep(100);
    }

    child.kill();
    console.error(`[tools] ${options.name} didn't start listening on port ${options.port} within 10 seconds`);
    throw new Error(`${options.name} didn't start`);
}

/**
 * runs a command to completion with its output shown, failing if it fails.
 * asynchronous on purpose: background processes keep forwarding their log lines while it runs.
 */
export async function runForeground(command: string, args: readonly string[], env?: Record<string, string>): Promise<void> {
    const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    const [code] = (await once(child, 'exit')) as [number | null];
    if (code !== 0) {
        console.error(`[tools] ${command} ${args.join(' ')} failed (exit ${code ?? 'none'})`);
        throw new Error(`${command} failed`);
    }
}
