/*
 * act 2, server streaming plus a deadline: one request, then updates arrive as the kitchen produces them.
 */
import { Code, ConnectError, createClient } from '@connectrpc/connect';
import { transport } from '../connection.js';
import { prefix } from '../format.js';
import { LunchService, OrderStage } from '../gen/lunch/v1/lunch_pb.js';

// long enough for any normal dish, nowhere near long enough for the brisket
const patienceMs = 6000;

const stageIcons: Record<OrderStage, string> = {
    [OrderStage.UNSPECIFIED]: '❔',
    [OrderStage.PLACED]: '🧾',
    [OrderStage.COOKING]: '🔥',
    [OrderStage.READY]: '✅',
};

/** orders a dish and prints each kitchen update until it's ready or our patience runs out. */
export async function watch(itemId: string): Promise<void> {
    const client = createClient(LunchService, transport);
    console.log(`${prefix} ⏱️  watching "${itemId}" (giving up after ${patienceMs / 1000}s)`);

    try {
        // a streaming response is just an async iterable; the deadline travels with the call so the server sees it too
        for await (const update of client.watchOrder({ itemId }, { timeoutMs: patienceMs })) {
            console.log(`${prefix} ${stageIcons[update.stage]} ${update.note}`);
        }
    } catch (error) {
        const connectError = ConnectError.from(error);
        if (connectError.code === Code.DeadlineExceeded) {
            // an expected outcome in this demo (hello, brisket), so it's reported rather than thrown
            console.log(`${prefix} ✗ DeadlineExceeded: waited ${patienceMs / 1000}s and gave up. The server was told, and stopped cooking.`);
            return;
        }

        if (connectError.code === Code.NotFound) {
            console.log(`${prefix} ✗ NotFound: ${connectError.rawMessage}`);
            return;
        }

        throw connectError;
    }
}
