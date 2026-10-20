/*
 * act 2, unary: one request, one response.
 */
import { Code, ConnectError, createClient } from '@connectrpc/connect';
import { transport } from '../connection.js';
import { dish, prefix } from '../format.js';
import { LunchService } from '../gen/lunch/v1/lunch_pb.js';

const client = createClient(LunchService, transport);

/** prints the whole menu. */
export async function showMenu(): Promise<void> {
    const { items } = await client.getMenu({});
    console.log(`${prefix} 📜 today's menu (${items.length} dishes):`);
    for (const item of items) {
        console.log(`   ${dish(item)}`);
    }
}

/** prints one dish; a dish that isn't on the menu prints the server's NOT_FOUND rather than failing. */
export async function showItem(itemId: string): Promise<void> {
    try {
        const { item } = await client.getMenuItem({ itemId });
        if (!item) {
            console.error(`${prefix} [menu] server replied without an item for "${itemId}"`);
            throw new TypeError(`GetMenuItem returned no item for "${itemId}"`);
        }

        console.log(`${prefix} 🍽️  ${dish(item)}`);
    } catch (error) {
        const connectError = ConnectError.from(error);
        if (connectError.code !== Code.NotFound) {
            throw connectError;
        }

        // an expected outcome for this demo, so it's reported rather than thrown
        console.log(`${prefix} ✗ ${Code[connectError.code]}: ${connectError.rawMessage}`);
    }
}
