/*
 * act 4, payload size: `npm run act4`
 * the same menu fetched as REST/JSON and as gRPC/protobuf, with the body bytes counted and projected to a busy service.
 * there's deliberately no timing loop: on localhost there's no network, so a loop measures client-library overhead
 * (which varies run to run) rather than anything about the protocols. byte counts are exact and repeatable.
 */
import { create, toBinary, toJsonString } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { GetMenuItemResponseSchema, GetMenuResponseSchema, LunchService } from './gen/lunch/v1/lunch_pb.js';
import { heading, table } from './shared/console.js';
import { ports, quietFetch, quietTransport } from './shared/kitchen.js';
import { requireListening } from './shared/processes.js';

// a modest internal service: 1,000 menu reads a second, all day
const callsPerSecond = 1000;
const secondsPerDay = 86_400;

await requireListening(ports.grpc, 'npm run server');

const client = createClient(LunchService, quietTransport(ports.grpc));
const encoder = new TextEncoder();
const bytes = (text: string) => encoder.encode(text).length;

heading('the same data, three encodings (body bytes only, no headers)');
const menu = await client.getMenu({});
const item = await client.getMenuItem({ itemId: 'existential-crisis' });
const restMenu = bytes(await (await quietFetch(ports.http, '/api/v1/menu')).text());
const restItem = bytes(await (await quietFetch(ports.http, '/api/v1/menu/existential-crisis')).text());
const protoMenu = toBinary(GetMenuResponseSchema, create(GetMenuResponseSchema, menu)).length;
const protoItem = toBinary(GetMenuItemResponseSchema, create(GetMenuItemResponseSchema, item)).length;

console.log(table([
    ['', 'one dish', 'whole menu'],
    ['REST, JSON (System.Text.Json)', `${restItem} B`, `${restMenu} B`],
    ['protobuf as JSON (canonical mapping)', `${bytes(toJsonString(GetMenuItemResponseSchema, item))} B`, `${bytes(toJsonString(GetMenuResponseSchema, menu))} B`],
    ['gRPC, binary protobuf', `${protoItem} B`, `${protoMenu} B`],
]));
console.log(`\n   Binary is ${Math.round((1 - protoMenu / restMenu) * 100)}% smaller for the menu. Field names never travel: just numbers, lengths and values.`);
console.log('   Most of what\'s left is the jokes. Text compresses poorly when it\'s this funny.');

heading(`at ${callsPerSecond.toLocaleString('en-US')} menu reads a second, for a day`);
const perDay = (size: number) => `${((size * callsPerSecond * secondsPerDay) / 1e9).toFixed(1)} GB`;
console.log(table([
    ['', 'per day'],
    ['REST, JSON', perDay(restMenu)],
    ['gRPC, protobuf', perDay(protoMenu)],
    ['saved', perDay(restMenu - protoMenu)],
]));
console.log('\n   Smaller payloads mean less bandwidth, and less CPU spent turning text into objects on both ends.');
console.log('   Gzip narrows the gap for large text-heavy bodies. Small, number-heavy messages are where protobuf shines.');
