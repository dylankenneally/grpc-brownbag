/*
 * the three things the page does. each takes the elements it writes to, so main.ts stays pure wiring.
 */
import { Code, ConnectError } from '@connectrpc/connect';
import { type MenuItem, OrderStage } from './gen/lunch/v1/lunch_pb.js';
import { grpcBaseUrl, lunch } from './kitchen.js';

const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const stageIcons: Record<OrderStage, string> = {
    [OrderStage.UNSPECIFIED]: '❔',
    [OrderStage.PLACED]: '🧾',
    [OrderStage.COOKING]: '🔥',
    [OrderStage.READY]: '✅',
};

/** POSTs to the native gRPC port the way a REST call would, and shows how it fails. */
export async function fetchGrpcPort(output: HTMLOutputElement): Promise<void> {
    output.textContent = 'Calling…';
    output.classList.remove('error');
    try {
        const response = await fetch(`${grpcBaseUrl}/lunch.v1.LunchService/GetMenu`, { method: 'POST', headers: { 'content-type': 'application/grpc' } });
        output.textContent = `HTTP ${response.status}. A browser can't send real gRPC, whatever the server says.`;
    } catch (error) {
        output.textContent = `✗ ${error instanceof Error ? error.message : String(error)}\nThe browser sent HTTP/1.1 to a port that only speaks HTTP/2, and couldn't read gRPC trailers even if it got that far.`;
    }

    output.classList.add('error');
}

/** where the menu demo renders. */
export interface MenuView {
    readonly table: HTMLTableElement;
    readonly body: HTMLTableSectionElement;
    readonly status: HTMLOutputElement;
}

/** loads the menu over gRPC-Web and renders it, with a "watch it cook" button per dish. */
export async function showMenu(view: MenuView, onWatch: (item: MenuItem) => void): Promise<void> {
    view.status.textContent = 'Calling…';
    view.status.classList.remove('error');
    try {
        const { items } = await lunch.getMenu({});
        view.body.replaceChildren(...items.map((item) => menuRow(item, onWatch)));
        view.table.hidden = false;
        view.status.textContent = `${items.length} dishes, decoded from binary protobuf in the browser.`;
    } catch (error) {
        const connectError = ConnectError.from(error);
        view.status.textContent = `✗ ${Code[connectError.code]}: ${connectError.rawMessage}. Is \`npm run server\` running?`;
        view.status.classList.add('error');
    }
}

/** streams kitchen updates for one dish into the list, as they arrive. */
export async function watchOrder(log: HTMLOListElement, item: MenuItem): Promise<void> {
    log.replaceChildren();
    try {
        // the same async iterable as in Node; each update renders the moment the kitchen sends it
        for await (const update of lunch.watchOrder({ itemId: item.id }, { timeoutMs: 6000 })) {
            appendLine(log, `${stageIcons[update.stage]} ${update.note}`);
        }
    } catch (error) {
        const connectError = ConnectError.from(error);
        appendLine(log, `✗ ${Code[connectError.code]}: ${connectError.code === Code.DeadlineExceeded ? 'gave up waiting after 6 seconds.' : connectError.rawMessage}`).classList.add('error');
    }
}

function menuRow(item: MenuItem, onWatch: (item: MenuItem) => void): HTMLTableRowElement {
    const row = document.createElement('tr');
    const watch = document.createElement('button');
    watch.type = 'button';
    watch.textContent = 'Watch it cook';
    watch.setAttribute('aria-label', `Watch ${item.name} cook`);
    watch.addEventListener('click', () => {
        onWatch(item);
    });

    row.append(cell(item.name), cell(dollars.format(item.priceCents / 100), 'price'), cell(item.description), cell(watch));
    return row;
}

function cell(content: string | HTMLElement, className?: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.append(content);
    if (className) {
        td.className = className;
    }

    return td;
}

function appendLine(log: HTMLOListElement, text: string): HTMLLIElement {
    const line = document.createElement('li');
    line.textContent = text;
    log.append(line);
    return line;
}
