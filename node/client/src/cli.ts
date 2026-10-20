/*
 * the TypeScript lunch client: `npm run ts -- <command> [args]`
 * - greet [name]   unary call to GreeterService
 * - menu           unary: the whole menu
 * - item <id>      unary: one dish (try an id that isn't on the menu)
 * - watch <id>     server streaming: live kitchen updates, with a 6 second deadline
 * - team           client streaming: the whole team's order, one bill back
 * - chat <name>    bidirectional streaming: type to chat, Ctrl+C to leave
 * set LUNCH_SERVER to point at a different server (default http://localhost:5051).
 */
import { userInfo } from 'node:os';
import { chat } from './commands/chat.js';
import { greet } from './commands/greet.js';
import { showItem, showMenu } from './commands/menu.js';
import { team } from './commands/team.js';
import { watch } from './commands/watch.js';

const [command = 'greet', argument] = process.argv.slice(2);

function required(value: string | undefined, usage: string): string {
    if (!value?.trim()) {
        console.error(`[client] missing argument; usage: ${usage}`);
        throw new TypeError(`missing argument; usage: ${usage}`);
    }

    return value;
}

switch (command) {
    case 'greet':
        await greet(argument ?? userInfo().username);
        break;
    case 'menu':
        await showMenu();
        break;
    case 'item':
        await showItem(required(argument, 'item <id>'));
        break;
    case 'watch':
        await watch(required(argument, 'watch <id>'));
        break;
    case 'team':
        await team();
        break;
    case 'chat':
        await chat(argument ?? userInfo().username);
        break;
    default:
        console.error(`[client] unknown command "${command}"; try: greet, menu, item, watch, team, chat`);
        throw new TypeError(`unknown command "${command}"`);
}
