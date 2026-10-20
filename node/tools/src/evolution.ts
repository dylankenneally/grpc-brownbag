/*
 * act 7, schema evolution: `npm run act7`
 * the till writes a lunch order with the original schema; four edited schemas then read the same bytes back.
 * finally `buf breaking` checks each edit against the original, catching the bad ones before they ship.
 * the schemas live in evolution/<variant>/lunch_order.proto.
 */
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { LunchOrderSchema as AddedSchema } from './gen/evolution/added/lunch_order_pb.js';
import { LunchOrderSchema as OriginalSchema } from './gen/evolution/original/lunch_order_pb.js';
import { LunchOrderSchema as RenumberedSchema } from './gen/evolution/renumbered/lunch_order_pb.js';
import { LunchOrderSchema as ReservedSchema } from './gen/evolution/reserved/lunch_order_pb.js';
import { LunchOrderSchema as ReusedSchema } from './gen/evolution/reused/lunch_order_pb.js';
import { buf, bufCommandLine } from './shared/buf.js';
import { heading, hexdump, money } from './shared/console.js';

// a fixed timestamp (20 Oct 2026, 12:30 UTC) so the bytes, and the punchline, are the same every run
const orderedAtUnix = 1_792_499_400;

heading('the till writes an order with the original schema');
const order = create(OriginalSchema, { dish: 'Legacy Lasagne', quantity: 2, priceCents: 1600, orderedAtUnix });
const bytes = toBinary(OriginalSchema, order);
console.log(`   ${order.quantity} × ${order.dish} at ${money(order.priceCents)} each, ordered at ${new Date(orderedAtUnix * 1000).toISOString()}`);
console.log(hexdump(bytes));

heading('✅ added: a new field on a new number (special_requests = 5)');
const added = fromBinary(AddedSchema, bytes);
console.log(`   ${added.quantity} × ${added.dish} at ${money(added.priceCents)}, special requests: "${added.specialRequests}" (empty: old orders never had any)`);

heading('❌ renumbered: price_cents and quantity swapped numbers 2 and 3 ("tidying up")');
const renumbered = fromBinary(RenumberedSchema, bytes);
console.log(`   ${renumbered.quantity.toLocaleString('en-US')} × ${renumbered.dish} at ${money(renumbered.priceCents)} each`);
console.log(`   Congratulations, you've ordered ${renumbered.quantity.toLocaleString('en-US')} lasagnes at ${money(renumbered.priceCents)} each. No error, no warning.`);

heading('❌ reused: ordered_at_unix deleted, number 4 given to tip_cents');
const reused = fromBinary(ReusedSchema, bytes);
console.log(`   ${reused.quantity} × ${reused.dish} at ${money(reused.priceCents)}, tip: ${money(reused.tipCents)}`);
console.log('   The old timestamp is now a tip. The chef is thrilled. Finance is not.');

heading('✅ reserved: the same deletion, with 4 and "ordered_at_unix" reserved and tip_cents on 5');
const reserved = fromBinary(ReservedSchema, bytes);
console.log(`   ${reserved.quantity} × ${reserved.dish} at ${money(reserved.priceCents)}, tip: ${money(reserved.tipCents)}`);
console.log('   Old field 4 is skipped (kept as an unknown field and passed through), and nobody can reuse the number.');

heading('buf breaking: catch it in CI, not in production');
for (const variant of ['added', 'renumbered', 'reused', 'reserved'] as const) {
    const args = ['breaking', `evolution/${variant}`, '--against', 'evolution/original'];
    const result = buf(args);
    console.log(`\n   $ ${bufCommandLine(args)}`);
    console.log(result.ok ? '   ✅ no breaking changes' : result.output.replace(/^/gm, '   ❌ '));
}
