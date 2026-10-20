/*
 * a layer-4 round-robin load balancer in a few lines: each new TCP connection goes to the next backend.
 * it never looks inside the bytes, which is exactly why it can't spread gRPC calls that share one connection.
 */
import { createServer, connect, type Server } from 'node:net';

/** one backend the proxy can forward to. */
export interface Backend {
    readonly name: string;
    readonly port: number;
}

/** a running proxy. */
export interface RoundRobinProxy {
    /** TCP connections accepted so far. */
    readonly connections: () => number;
    readonly server: Server;
}

// enough lines to show the alternation without scrolling the audience's eyes off the screen
const loggedConnections = 4;

/** starts the proxy listening on localhost; resolves once it's accepting connections. */
export async function startRoundRobinProxy(options: { label: string; port: number; backends: readonly [Backend, ...Backend[]] }): Promise<RoundRobinProxy> {
    let accepted = 0;
    const server = createServer((client) => {
        const backend = options.backends[accepted % options.backends.length] ?? options.backends[0];
        accepted++;
        if (accepted <= loggedConnections) {
            console.log(`   [${options.label} proxy] 🔀 TCP connection #${accepted} → kitchen ${backend.name}`);
        } else if (accepted === loggedConnections + 1) {
            console.log(`   [${options.label} proxy] 🔀 … and so on, alternating`);
        }

        const upstream = connect({ port: backend.port, host: 'localhost' });
        client.pipe(upstream).pipe(client);
        client.on('error', () => upstream.destroy());
        upstream.on('error', () => client.destroy());
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(options.port, 'localhost', resolve);
    });
    return { connections: () => accepted, server };
}
