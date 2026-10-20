/*
 * console helpers for presenting on a projector.
 */

/** a section heading the audience can find on screen. */
export function heading(text: string): void {
    console.log(`\n━━━ ${text} ${'━'.repeat(Math.max(0, 70 - text.length))}`);
}

/** classic hex dump: offset, 16 bytes of hex, then the printable characters. */
export function hexdump(bytes: Uint8Array, limit = 256): string {
    const lines: string[] = [];
    const shown = bytes.subarray(0, limit);
    for (let offset = 0; offset < shown.length; offset += 16) {
        const row = shown.subarray(offset, offset + 16);
        const hex = Array.from(row, (x) => x.toString(16).padStart(2, '0')).join(' ');
        const ascii = Array.from(row, (x) => (x >= 0x20 && x < 0x7f ? String.fromCharCode(x) : '.')).join('');
        lines.push(`   ${offset.toString(16).padStart(4, '0')}  ${hex.padEnd(47)}  ${ascii}`);
    }

    if (bytes.length > limit) {
        lines.push(`   … ${bytes.length - limit} more bytes`);
    }

    return lines.join('\n');
}

/** whole cents as dollars. */
export function money(cents: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** a table with left-aligned first column and right-aligned others. */
export function table(rows: readonly (readonly string[])[]): string {
    const widths = rows[0]?.map((_, column) => Math.max(...rows.map((row) => row[column]?.length ?? 0))) ?? [];
    return rows.map((row) => `   ${row.map((cell, column) => (column === 0 ? cell.padEnd(widths[column] ?? 0) : cell.padStart(widths[column] ?? 0))).join('   ')}`).join('\n');
}
