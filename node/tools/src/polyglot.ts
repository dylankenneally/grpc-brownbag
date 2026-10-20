/*
 * act 9, polyglot: `npm run act9`
 * - starts the Go food truck (a Go GreeterService) and greets it from the TypeScript and C# clients
 * - runs the Go diner against the C# kitchen
 * nobody on either end knows, or cares, which language is on the other side. needs `npm run server` running.
 */
import { resolve } from 'node:path';
import { heading } from './shared/console.js';
import { binaries, ports, repoRoot } from './shared/kitchen.js';
import { requireFile, requireListening, runForeground, startBackground } from './shared/processes.js';

requireFile(binaries.goFoodTruck, 'npm run setup (with Go installed)');
requireFile(binaries.goDiner, 'npm run setup (with Go installed)');
requireFile(binaries.clientDll, 'npm run build');
await requireListening(ports.grpc, 'npm run server');

const goServer = `http://localhost:${ports.goFoodTruck}`;
const foodTruck = await startBackground({ name: 'go food truck', command: binaries.goFoodTruck, args: [`-port=${ports.goFoodTruck}`], port: ports.goFoodTruck, echo: /👋|🚚/ });
try {
    heading('TypeScript → Go');
    // the same TypeScript client as `npm run ts`, run with tsx's loader directly
    await runForeground(process.execPath, ['--import', 'tsx', resolve(repoRoot, 'node/client/src/cli.ts'), 'greet', 'Ada'], { LUNCH_SERVER: goServer });

    heading('C# → Go');
    await runForeground('dotnet', [binaries.clientDll, 'greet', 'Grace'], { LUNCH_SERVER: goServer });

    heading('Go → C#');
    await runForeground(binaries.goDiner, [`-server=localhost:${ports.grpc}`, '-dish=legacy-lasagne']);
} finally {
    foodTruck.stop();
}

console.log('\n   Three languages, one .proto file, zero hand-written serialisation.');
