/*
 * where everything lives, and how the tools talk to the kitchen.
 * - ports and build-output paths shared by every tool
 * - transports that send the "quiet" header, so firing hundreds of calls doesn't flood the server log
 */
import type { Interceptor } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { resolve } from 'node:path';

/** the repository root, whichever directory the tool was started from. */
export const repoRoot = resolve(import.meta.dirname, '../../../..');

/** fixed demo ports; keep in step with dotnet/Server/KitchenOptions.cs, go/cmd/foodtruck and scripts/doctor.mjs. */
export const ports = {
    grpc: 5051,
    http: 5080,
    goFoodTruck: 5052,
    proxyGrpc: 5060,
    kitchenA: { grpc: 5061, http: 5071 },
    kitchenB: { grpc: 5062, http: 5072 },
    proxyHttp: 5070,
} as const;

/** response headers the kitchen stamps on every call. */
export const headers = { kitchen: 'x-kitchen', connection: 'x-kitchen-connection', quiet: 'x-brownbag-quiet' } as const;

const exe = process.platform === 'win32' ? '.exe' : '';

/** build outputs the tools launch directly, so stopping them stops the real process rather than a wrapper. */
export const binaries = {
    serverDir: resolve(repoRoot, 'dotnet/Server/bin/Debug/net10.0'),
    serverDll: resolve(repoRoot, 'dotnet/Server/bin/Debug/net10.0/BrownBag.Server.dll'),
    clientDll: resolve(repoRoot, 'dotnet/Client/bin/Debug/net10.0/BrownBag.Client.dll'),
    goFoodTruck: resolve(repoRoot, `go/bin/foodtruck${exe}`),
    goDiner: resolve(repoRoot, `go/bin/diner${exe}`),
} as const;

// stops the per-request log line on the server; the tools report their own totals instead
const quiet: Interceptor = (next) => async (request) => {
    request.header.set(headers.quiet, '1');
    return await next(request);
};

/** a native gRPC transport to a port on localhost, with server logging turned off. */
export function quietTransport(port: number) {
    return createGrpcTransport({ baseUrl: `http://localhost:${port}`, interceptors: [quiet] });
}

/** fetch() against the REST API on a port, with server logging turned off. */
export async function quietFetch(port: number, path: string): Promise<Response> {
    const response = await fetch(`http://localhost:${port}${path}`, { headers: { [headers.quiet]: '1' } });
    if (!response.ok) {
        console.error(`[tools] GET ${path} on port ${port} returned ${response.status}`);
        throw new Error(`GET ${path} returned ${response.status}`);
    }

    return response;
}
