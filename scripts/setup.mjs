// @ts-check
/*
 * one-command setup: `npm run setup`
 * - checks prerequisites first (same report as `npm run doctor`)
 * - installs dependencies, then generates and builds everything the demos need
 * - builds the Go programs too, when Go is installed (only the polyglot demo needs them)
 * safe to re-run; each step converges to the same end state.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { runDoctor } from './doctor.mjs';

/**
 * @typedef {object} Step
 * @property {string} label what the presenter sees
 * @property {string} command fixed command line (no user input, so running it through the shell is safe)
 */

// npm ci needs the lockfile; a fresh checkout without one falls back to npm install
const install = existsSync('package-lock.json') ? 'npm ci' : 'npm install';
const hasGo = spawnSync('go', ['version']).status === 0;

/** @type {Step[]} */
const steps = [
    { label: 'installing npm packages', command: install },
    { label: 'generating code from proto/', command: 'npm run generate' },
    { label: 'building the C# server and client (generates C# from proto/)', command: 'npm run build' },
    ...(hasGo ? [{ label: 'building the Go food truck and diner', command: 'npm run build:go' }] : []),
];

/**
 * run one step, streaming its output; throws if it fails so later steps never run on a broken base.
 * @param {Step} step
 */
function runStep(step) {
    console.log(`\n🍳 ${step.label}: ${step.command}`);
    // shell is needed so Windows can resolve npm.cmd; the macOS path behaves the same either way
    const result = spawnSync(step.command, { shell: true, stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`[setup] "${step.label}" failed (exit ${result.status ?? 'none'}); fix the error above and run \`npm run setup\` again.`);
        throw new Error(`setup step failed: ${step.command}`);
    }
}

if (!(await runDoctor())) {
    console.error('[setup] prerequisites missing; see the doctor report above.');
    throw new Error('prerequisites missing');
}

for (const step of steps) {
    runStep(step);
}

if (!hasGo) {
    console.log('\n⚠️  Go not found, so the Go programs weren\'t built. Everything except the polyglot demo (act 9) works without it.');
}

console.log('\n🥡 Setup complete. Lunch is served.\n');
