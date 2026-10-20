/*
 * act 6, the load-balancer trap: `npm run act6`
 * starts two kitchens (A and B) behind a round-robin TCP proxy, then sends the same burst of calls three ways:
 * 1. gRPC through the proxy: one HTTP/2 connection, so one kitchen gets everything
 * 2. REST through the proxy: many HTTP/1.1 connections, so the work spreads
 * 3. gRPC with client-side round robin (the C# client): it connects to every kitchen and spreads calls itself
 * everything this act starts, it stops again. the main server (npm run server) isn't needed.
 */
import { createClient } from '@connectrpc/connect';
import { LunchService } from './gen/lunch/v1/lunch_pb.js';
import { heading } from './shared/console.js';
import { binaries, headers, ports, quietFetch, quietTransport } from './shared/kitchen.js';
import { type Background, requireFile, runForeground, startBackground } from './shared/processes.js';
import { type RoundRobinProxy, startRoundRobinProxy } from './shared/tcp-proxy.js';

const calls = 100;
const kitchens = [
    { name: 'A', ...ports.kitchenA },
    { name: 'B', ...ports.kitchenB },
] as const;

requireFile(binaries.serverDll, 'npm run build');
requireFile(binaries.clientDll, 'npm run build');

const running: Background[] = [];
const proxies: RoundRobinProxy[] = [];
try {
    heading('opening two kitchens behind a round-robin TCP proxy');
    for (const kitchen of kitchens) {
        const args = [binaries.serverDll, `--Kitchen:Name=${kitchen.name}`, `--Kitchen:GrpcPort=${kitchen.grpc}`, `--Kitchen:HttpPort=${kitchen.http}`];
        running.push(await startBackground({ name: `kitchen ${kitchen.name}`, command: 'dotnet', args, port: kitchen.grpc, cwd: binaries.serverDir }));
        console.log(`   🍽️  kitchen ${kitchen.name}: gRPC :${kitchen.grpc}, REST :${kitchen.http}`);
    }

    const [a, b] = kitchens;
    const grpcProxy = await startRoundRobinProxy({ label: 'gRPC', port: ports.proxyGrpc, backends: [{ name: a.name, port: a.grpc }, { name: b.name, port: b.grpc }] });
    const restProxy = await startRoundRobinProxy({ label: 'REST', port: ports.proxyHttp, backends: [{ name: a.name, port: a.http }, { name: b.name, port: b.http }] });
    proxies.push(grpcProxy, restProxy);
    console.log(`   🔀 proxy: gRPC :${ports.proxyGrpc}, REST :${ports.proxyHttp}`);

    heading(`1. gRPC through the proxy: ${calls} concurrent calls`);
    const client = createClient(LunchService, quietTransport(ports.proxyGrpc));
    report(await Promise.all(Array.from({ length: calls }, async () => {
        let kitchen = '?';
        await client.getMenuItem({ itemId: 'kale' }, { onHeader: (h) => (kitchen = h.get(headers.kitchen) ?? '?') });
        return kitchen;
    })), grpcProxy.connections());

    heading(`2. REST through the same kind of proxy: ${calls} concurrent calls`);
    report(await Promise.all(Array.from({ length: calls }, async () => {
        const response = await quietFetch(ports.proxyHttp, '/api/v1/menu/kale');
        await response.text();
        return response.headers.get(headers.kitchen) ?? '?';
    })), restProxy.connections());

    heading(`3. the fix: client-side round robin (C# client, straight to both kitchens): ${calls} calls`);
    await runForeground('dotnet', [binaries.clientDll, 'lb-fix', `${a.grpc}`, `${b.grpc}`]);

    console.log('\n   Other fixes: an L7 proxy that understands HTTP/2 streams (Envoy, Linkerd, a cloud L7 load balancer),');
    console.log('   or capping connection age on the server so clients reconnect and rebalance.');
} finally {
    for (const proxy of proxies) {
        proxy.server.close();
    }

    for (const background of running) {
        background.stop();
    }
}

// prints how many calls each kitchen served, with commentary
function report(kitchensThatServed: readonly string[], connections: number): void {
    console.log(`   the proxy saw ${connections} TCP connection(s):`);
    for (const kitchen of kitchens) {
        const served = kitchensThatServed.filter((x) => x === kitchen.name).length;
        const mood = served === 0 ? '😴 chef is playing Candy Crush' : served === calls ? '🔥 chef is crying into the fryer' : '🙂 a fair day\'s work';
        console.log(`   kitchen ${kitchen.name}: ${String(served).padStart(3)} orders  ${mood}`);
    }
}
