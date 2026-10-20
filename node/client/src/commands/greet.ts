/*
 * act 1: a remote call that reads like a local function call.
 */
import { Code, ConnectError, createClient } from '@connectrpc/connect';
import { transport } from '../connection.js';
import { prefix } from '../format.js';
import { GreeterService } from '../gen/greeter/v1/greeter_pb.js';

/** says hello to the server and prints the reply. */
export async function greet(name: string): Promise<void> {
    // the client is generated from greeter.proto: no URLs, no JSON, no fetch plumbing
    const client = createClient(GreeterService, transport);

    try {
        // a typed method on a typed client: autocomplete knows `name` exists and `message` comes back
        const reply = await client.sayHello({ name });
        console.log(`${prefix} → ${reply.message}`);
    } catch (error) {
        // gRPC failures arrive as a status code plus detail, not an HTTP status and a body to parse
        const connectError = ConnectError.from(error);
        console.error(`${prefix} ✗ ${Code[connectError.code]}: ${connectError.rawMessage}`);
        throw connectError;
    }
}
