/*
 * page wiring: find the elements, connect the buttons to the demos.
 */
import { fetchGrpcPort, showMenu, watchOrder } from './demos.js';

// the page and this script ship together, so a missing element is a bug in index.html
function element<T extends HTMLElement>(id: string, type: new () => T): T {
    const found = document.getElementById(id);
    if (!(found instanceof type)) {
        console.error(`[web] #${id} is missing from index.html or isn't a ${type.name}`); // eslint-disable-line no-console
        throw new TypeError(`#${id} is missing or isn't a ${type.name}`);
    }

    return found;
}

const fetchButton = element('fetch-button', HTMLButtonElement);
const fetchResult = element('fetch-result', HTMLOutputElement);
const menuButton = element('menu-button', HTMLButtonElement);
const menuView = { table: element('menu-table', HTMLTableElement), body: element('menu-body', HTMLTableSectionElement), status: element('menu-status', HTMLOutputElement) };
const watchLog = element('watch-log', HTMLOListElement);

fetchButton.addEventListener('click', () => void fetchGrpcPort(fetchResult));
menuButton.addEventListener('click', () => void showMenu(menuView, (item) => void watchOrder(watchLog, item)));
