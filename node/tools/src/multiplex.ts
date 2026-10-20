/*
 * act 5, multiplexing: `npm run act5`
 * fires the same burst of concurrent calls at the kitchen twice and counts the TCP connections that carried them:
 * - gRPC over HTTP/2: every call is its own stream on one shared connection
 * - REST over HTTP/1.1: a connection carries one request at a time, so concurrency means more connections
 * the server stamps each response with its connection id, and also logs every new connection (🔌) as it opens.
 */
import { createClient } from '@connectrpc/connect';
import { LunchService } from './gen/lunch/v1/lunch_pb.js';
import { heading, table } from './shared/console.js';
import { headers, ports, quietFetch, quietTransport } from './shared/kitchen.js';
import { requireListening } from './shared/processes.js';

const concurrency = Number(process.argv[2] ?? 100);

await requireListening(ports.grpc, 'npm run server');

heading(`gRPC: ${concurrency} concurrent calls on one channel`);
// a fresh transport, so this run starts from zero connections
const client = createClient(LunchService, quietTransport(ports.grpc));
const grpcConnections = await countConnections(async () => {
    let connection = '';
    await client.getMenuItem({ itemId: 'kale' }, { onHeader: (h) => (connection = h.get(headers.connection) ?? '') });
    return connection;
});
console.log(`   ${grpcConnections} TCP connection(s)`);

heading(`REST: ${concurrency} concurrent fetch() calls over HTTP/1.1`);
const restConnections = await countConnections(async () => {
    const response = await quietFetch(ports.http, '/api/v1/menu/kale');
    await response.text();
    return response.headers.get(headers.connection) ?? '';
});
console.log(`   ${restConnections} TCP connection(s)`);

heading('so what?');
console.log(table([
    ['', 'calls', 'TCP connections'],
    ['gRPC (HTTP/2)', `${concurrency}`, `${grpcConnections}`],
    ['REST (HTTP/1.1)', `${concurrency}`, `${restConnections}`],
]));
console.log('\n   Each new connection costs a TCP handshake (and a TLS handshake in production) plus server memory.');
console.log('   Browsers cap HTTP/1.1 at about 6 connections per host, so the rest of the requests queue.');
console.log('   Remember that one gRPC connection: it\'s the whole point of the next act.');

// fires the call `concurrency` times at once and counts the distinct connection ids the server reported
async function countConnections(call: () => Promise<string>): Promise<number> {
    const ids = await Promise.all(Array.from({ length: concurrency }, call));
    return new Set(ids).size;
}
