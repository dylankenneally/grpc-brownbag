/*
 * console formatting shared by the commands.
 */
import { type MenuItem, SpiceLevel } from './gen/lunch/v1/lunch_pb.js';

/** prefix on every line this client prints, so it's easy to tell apart from the C# client. */
export const prefix = '🔵 TS';

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** whole cents as dollars, e.g. 1250 → $12.50. */
export function money(cents: number): string {
    return dollars.format(cents / 100);
}

const chillies: Record<SpiceLevel, string> = {
    [SpiceLevel.UNSPECIFIED]: '?',
    [SpiceLevel.MILD]: '🌶️',
    [SpiceLevel.MEDIUM]: '🌶️🌶️',
    [SpiceLevel.HOT]: '🌶️🌶️🌶️',
    [SpiceLevel.REGRET]: '☠️',
};

/** one dish on one line. */
export function dish(item: MenuItem): string {
    return `${item.name.padEnd(34)} ${money(item.priceCents).padStart(8)}  ${chillies[item.spiceLevel].padEnd(8)}  ${item.description}`;
}
