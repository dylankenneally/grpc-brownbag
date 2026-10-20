/*
 * act 2, bidirectional streaming: both sides talk whenever they like, over one call.
 */
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { createInterface } from 'node:readline';
import { transport } from '../connection.js';
import { prefix } from '../format.js';
import { LunchService, type LunchChatRequest, LunchChatRequestSchema } from '../gen/lunch/v1/lunch_pb.js';

// every line typed becomes a message; the stream ends when input does (Ctrl+D, or the end of piped input)
async function* typedLines(): AsyncGenerator<LunchChatRequest> {
    const input = createInterface({ input: process.stdin });
    for await (const text of input) {
        if (text.trim() !== '') {
            yield create(LunchChatRequestSchema, { text });
        }
    }
}

/** joins the lunch chat; each line typed is sent, and everything the room says is printed as it arrives. */
export async function chat(diner: string): Promise<void> {
    const client = createClient(LunchService, transport);
    console.log(`${prefix} 💬 joined as ${diner}; type a message and press Enter (Ctrl+C or end of input to leave)`);

    // the name travels as call metadata (a header), not inside every message
    const replies = client.lunchChat(typedLines(), { headers: { 'x-diner': diner } });
    for await (const line of replies) {
        console.log(`   ${line.from}: ${line.text}`);
    }
}
