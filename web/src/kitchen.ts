/*
 * the browser's view of the kitchen: the generated LunchService client over gRPC-Web.
 * the generated code is the same as the Node client's; only the transport differs.
 */
import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { LunchService } from './gen/lunch/v1/lunch_pb.js';

/** the kitchen's HTTP/1.1 port (gRPC-Web + REST); override with VITE_LUNCH_SERVER. */
export const webBaseUrl: string = import.meta.env.VITE_LUNCH_SERVER ?? 'http://localhost:5080';

/** the kitchen's native gRPC port, which a browser can't talk to. */
export const grpcBaseUrl = 'http://localhost:5051';

/** the lunch client, over gRPC-Web. */
export const lunch = createClient(LunchService, createGrpcWebTransport({ baseUrl: webBaseUrl }));
