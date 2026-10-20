/*
 * act 3, the debugging wall: `npm run act3`
 * 1. a plain HTTP/1.1 request (what fetch, curl and browsers send by default) bounces off the gRPC port
 * 2. a hand-built gRPC request over raw HTTP/2 gets an answer back, which is mostly unreadable bytes
 * 3. walking those bytes by field number recovers values, but with no names
 * 4. the generated schema turns the same bytes back into a typed object
 * 5. server reflection lets `buf curl` discover the API and call it with JSON, no .proto file needed
 */
import { fromBinary, toBinary, toJsonString, create } from '@bufbuild/protobuf';
import { BinaryReader, WireType } from '@bufbuild/protobuf/wire';
import { connect, type IncomingHttpHeaders } from 'node:http2';
import { GetMenuItemRequestSchema, GetMenuItemResponseSchema } from './gen/lunch/v1/lunch_pb.js';
import { buf, bufCommandLine } from './shared/buf.js';
import { heading, hexdump } from './shared/console.js';
import { ports } from './shared/kitchen.js';
import { requireListening } from './shared/processes.js';

const itemId = process.argv[2] ?? 'existential-crisis';
const path = '/lunch.v1.LunchService/GetMenuItem';
const baseUrl = `http://localhost:${ports.grpc}`;

await requireListening(ports.grpc, 'npm run server');

heading('1. fetch() it like a REST API');
try {
    const response = await fetch(`${baseUrl}${path}`, { method: 'POST', body: JSON.stringify({ itemId }), headers: { 'content-type': 'application/json' } });
    console.log(`   ✗ HTTP ${response.status}: ${await response.text()}`);
} catch (error) {
    // some servers just drop the connection rather than answering an HTTP/1.1 request on an HTTP/2-only port
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : String(error);
    console.log(`   ✗ fetch failed: ${cause}`);
}

console.log('   The port only speaks HTTP/2, and even then the body has to be protobuf, not JSON.');

heading('2. send a real gRPC request over raw HTTP/2');
const message = toBinary(GetMenuItemRequestSchema, create(GetMenuItemRequestSchema, { itemId }));
const requestFrame = frame(message);
console.log(`   request: POST ${path}, content-type application/grpc, ${requestFrame.length} bytes:`);
console.log(hexdump(requestFrame));
const { body, status } = await rawGrpcCall(requestFrame);
console.log(`\n   response: ${body.length} bytes, grpc-status ${status}:`);
console.log(hexdump(body));
console.log('   The first 5 bytes are gRPC framing: 1 compression flag, then a 4-byte big-endian length.');

heading('3. decode it with no schema: just field numbers and wire types');
const responseMessage = body.subarray(5);
for (const line of describeRaw(responseMessage, 1)) {
    console.log(line);
}

console.log('   Values are there, but names aren\'t. Field 5 = 1 could mean anything.');

heading('4. decode it with the schema (generated from lunch.proto)');
const decoded = fromBinary(GetMenuItemResponseSchema, responseMessage);
console.log(indent(toJsonString(GetMenuItemResponseSchema, decoded, { prettySpaces: 2 })));

heading('5. ask the server what it offers (server reflection) with buf curl');
showBuf(['curl', '--protocol', 'grpc', '--http2-prior-knowledge', '--list-methods', baseUrl]);
showBuf(['curl', '--protocol', 'grpc', '--http2-prior-knowledge', '-d', JSON.stringify({ itemId: 'kale' }), `${baseUrl}${path}`]);
console.log('\n   grpcurl does the same thing: grpcurl -plaintext -d \'{"itemId":"kale"}\' localhost:5051 lunch.v1.LunchService/GetMenuItem');

// gRPC's length-prefixed message framing
function frame(bytes: Uint8Array): Uint8Array {
    const framed = new Uint8Array(5 + bytes.length);
    new DataView(framed.buffer).setUint32(1, bytes.length);
    framed.set(bytes, 5);
    return framed;
}

// one unary call over node's raw HTTP/2 client: no gRPC library involved
function rawGrpcCall(requestBody: Uint8Array): Promise<{ body: Uint8Array; status: string }> {
    return new Promise((resolve, reject) => {
        const session = connect(baseUrl);
        session.once('error', reject);
        const request = session.request({ ':method': 'POST', ':path': path, 'content-type': 'application/grpc', te: 'trailers' });
        const chunks: Buffer[] = [];
        let status = '(none)';
        request.on('response', (responseHeaders) => {
            status = String(responseHeaders['grpc-status'] ?? status);
        });
        request.on('trailers', (trailers: IncomingHttpHeaders) => {
            status = String(trailers['grpc-status'] ?? status);
        });
        request.on('data', (chunk: Buffer) => chunks.push(chunk));
        request.once('error', reject);
        request.once('end', () => {
            session.close();
            resolve({ body: new Uint8Array(Buffer.concat(chunks)), status });
        });
        request.end(requestBody);
    });
}

// walks protobuf bytes by tag; length-delimited fields are shown as text when printable, otherwise decoded as a nested message
function describeRaw(bytes: Uint8Array, depth: number): string[] {
    const lines: string[] = [];
    const pad = '   '.repeat(depth);
    const reader = new BinaryReader(bytes);
    while (reader.pos < reader.len) {
        const [field, wireType] = reader.tag();
        switch (wireType) {
            case WireType.Varint:
                lines.push(`${pad}field ${field} (varint): ${reader.uint64()}`);
                break;
            case WireType.LengthDelimited: {
                const value = reader.bytes();
                const text = printable(value);
                if (text !== undefined) {
                    lines.push(`${pad}field ${field} (length-delimited, ${value.length} bytes): "${text}"`);
                } else {
                    lines.push(`${pad}field ${field} (length-delimited, ${value.length} bytes): a nested message?`);
                    lines.push(...describeRaw(value, depth + 1));
                }

                break;
            }
            case WireType.Bit32:
                lines.push(`${pad}field ${field} (32-bit): ${reader.fixed32()}`);
                break;
            case WireType.Bit64:
                lines.push(`${pad}field ${field} (64-bit): ${reader.fixed64()}`);
                break;
            case WireType.StartGroup:
            case WireType.EndGroup:
                lines.push(`${pad}field ${field} (group, skipped)`);
                reader.skip(wireType, field);
                break;
            default: {
                const unknown: never = wireType;
                console.error(`[wire] unknown wire type ${String(unknown)}`);
                throw new TypeError(`unknown wire type ${String(unknown)}`);
            }
        }
    }

    return lines;
}

// valid UTF-8 with no control characters, or undefined
function printable(bytes: Uint8Array): string | undefined {
    try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        return /^[^\p{Cc}]*$/u.test(text) ? text : undefined;
    } catch {
        return undefined;
    }
}

function indent(text: string): string {
    return text.replace(/^/gm, '   ');
}

function showBuf(args: readonly string[]): void {
    console.log(`\n   $ ${bufCommandLine(args)}`);
    const result = buf(args);
    if (!result.ok) {
        console.error(`[wire] buf failed:\n${result.output}`);
        throw new Error('buf curl failed');
    }

    console.log(indent(result.output));
}
