/*
 * act 2, client streaming: many messages up, one response back.
 */
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { setTimeout as sleep } from 'node:timers/promises';
import { transport } from '../connection.js';
import { money, prefix } from '../format.js';
import { LunchService, type PlaceTeamOrderRequest, PlaceTeamOrderRequestSchema } from '../gen/lunch/v1/lunch_pb.js';

const orders = [
    { diner: 'Ada', itemId: 'merge-conflict-burrito', quantity: 1 },
    { diner: 'Grace', itemId: 'schrodingers-soup', quantity: 1 },
    { diner: 'Linus', itemId: 'null-pointer-nachos', quantity: 2 },
    { diner: 'Margaret', itemId: 'kale', quantity: 1 },
    { diner: 'Dave', itemId: 'brisket', quantity: 3 },
] as const;

// the request stream is an async generator; returning from it is the "that's everyone" signal
async function* teamLines(): AsyncGenerator<PlaceTeamOrderRequest> {
    for (const order of orders) {
        console.log(`${prefix} ⬆️  ${order.diner} adds ${order.quantity} × ${order.itemId}`);
        yield create(PlaceTeamOrderRequestSchema, order);

        // a pause so the audience can watch the lines arrive at the server one at a time
        await sleep(400);
    }
}

/** streams each diner's line to the kitchen, then prints the bill. */
export async function team(): Promise<void> {
    const client = createClient(LunchService, transport);
    const bill = await client.placeTeamOrder(teamLines());

    console.log(`${prefix} 🧾 ${bill.lineCount} lines, total ${money(bill.totalCents)}`);
    for (const diner of bill.diners) {
        console.log(`   ${diner.diner.padEnd(10)} ${money(diner.totalCents).padStart(8)}`);
    }

    console.log(`${prefix} 💬 ${bill.remark}`);
}
