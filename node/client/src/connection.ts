/*
 * one shared transport for every command: one HTTP/2 connection, reused by every call.
 */
import { createGrpcTransport } from '@connectrpc/connect-node';

/** where the server is; override with LUNCH_SERVER. */
export const baseUrl = process.env.LUNCH_SERVER ?? 'http://localhost:5051';

/** native gRPC over HTTP/2; the transport is the only part of the client that knows about the network. */
export const transport = createGrpcTransport({ baseUrl });
