# Presenter runbook

The script for presenting the session: what to run, what to say and how long each part takes. Background on gRPC itself is in [brown-bag-run-sheet.md](../brown-bag-run-sheet.md). Setup and tooling are in the [README](../README.md).

The session is 45 minutes: about 33 minutes of demos, 2 minutes of slack and 10 minutes of Q&A.

| # | Act | Minutes | Running total |
|---|-----|---------|---------------|
| – | Intro: what gRPC is (run sheet) | 3 | 3 |
| 1 | Hello gRPC | 4 | 7 |
| 2 | Four patterns + deadline | 6 | 13 |
| 3 | The debugging wall | 3 | 16 |
| 4 | Payload size | 3 | 19 |
| 5 | Multiplexing | 3 | 22 |
| 6 | Load-balancer trap (skip if behind) | 3 | 25 |
| 7 | Schema evolution | 3 | 28 |
| 8 | The browser | 3 | 31 |
| 9 | Polyglot (skip if behind) | 2 | 33 |
| | Q&A | 10 | 43 |

If you're behind at the end of act 5, skip act 6 and summarise it in one line: "an L4 load balancer sees one connection, so all your gRPC traffic goes to one box." Skip act 9 the same way: "act 1 already showed C# and TypeScript sharing one contract; Go is no different."

## Before the session

- [ ] `npm run setup` on the presenting machine, on the network you'll present from (it downloads packages)
- [ ] `npm run doctor` shows every port free
- [ ] Bump the terminal font size and use a dark theme, so the emoji in the logs show up
- [ ] Open the editor with these tabs, in order:
  - `proto/greeter/v1/greeter.proto`
  - `dotnet/Server/Services/GreeterService.cs`
  - `node/client/src/commands/greet.ts`
  - `proto/lunch/v1/lunch.proto`
  - `dotnet/Server/Services/LunchService.cs`
  - `evolution/renumbered/lunch_order.proto`
- [ ] Terminal layout: **server** on the left, **client** on the right, and a third terminal ready for the chat
- [ ] Start `npm run server` in the left terminal
- [ ] Dry run `npm run act1` and `npm run act8` (close the browser tab afterwards), then clear the terminals

## Act 1: Hello gRPC (4 min)

**The point:** one `.proto` file is the contract, and calling a remote service feels like calling a local function.

1. **Show `greeter.proto`** (1 min)
   - One service, one method, two messages. That's the whole API definition.
   - Point at the `= 1` after each field. Field numbers, not names, go over the wire. Act 7 comes back to this.
   - Point at `greeter.v1`: the version lives in the package name, so a breaking v2 can sit beside v1.
   - Optional aside: buf's lint rules made us call it `GreeterService` and `SayHelloRequest`, rather than the `Greeter` / `HelloRequest` in most tutorials. Naming is enforced by a tool, not debated in code review.
2. **Show `GreeterService.cs`** (1 min)
   - The whole server is one `override` of a base class generated from the `.proto`. No controllers, no routes, no JSON.
   - The blank-name check throws a gRPC status code (`InvalidArgument`), not an HTTP 400.
3. **Run it** (1 min): `npm run act1`
   - The C# client 🟣 and the TypeScript client 🔵 get the same reply from the same server.
   - In the server terminal, each call is an `HTTP/2 POST` to `/greeter.v1.GreeterService/SayHello`. That's the whole addressing scheme: package, service, method.
4. **Show `greet.ts`** (1 min)
   - Create a client, call `sayHello`, get a typed object back. The C# version in `dotnet/Client/Commands/Greet.cs` reads the same.
   - Type `client.` and let autocomplete list `sayHello`, then `reply.` to show it knows about `message`.

**Bonus, if there's time:** `npm run act1:ts -- " "` sends a blank name. The client gets `InvalidArgument: Even anonymous diners need a name for the coffee cup.` The server log says `200, grpc-status 3`: HTTP 200 only means the kitchen answered the door. gRPC carries its own status separately, in a trailer.

**Jokes on hand:** "Today's special is strongly typed." If someone asks why not REST: "REST is for people who enjoy arguing about `PUT` versus `PATCH`."

## Act 2: Four patterns + a deadline (6 min)

**The point:** gRPC has four call shapes, and streaming is built in, not bolted on.

1. **Show `lunch.proto`** (1 min). Point at the five `rpc` lines and the `stream` keyword: none, on the response, on the request, on both.
2. **Unary** (1 min): `npm run act2:unary`. The menu, one dish, then `caviar`, which comes back as `NOT_FOUND`: "We're out of caviar. We were never in of caviar."
3. **Server streaming** (1 min): `npm run act2:server-stream`. One request, then the kitchen sends updates as they happen. Schrödinger's Soup is hot and cold until observed. This is what you'd otherwise build with polling or WebSockets.
4. **Client streaming** (1 min): `npm run act2:client-stream`. Each diner's line streams up and the server logs it as it arrives (📝). Only when the client says "that's everyone" does one bill come back. Dave owes you money. Dave always owes you money.
5. **Bidirectional** (1 min): in the client terminal run `npm run chat:cs -- Ada`, and in the third terminal `npm run chat:ts -- Grace`.
   - Type in both. Messages flow both ways on one call, whenever either side likes.
   - Ask the audience for words to type. LunchBot reacts to "kale", "Dave", "deploy", "bug", "hungry", "brisket", "gRPC" and "REST".
   - Ctrl+C both to leave.
6. **Deadlines** (1 min): `npm run act2:deadline`. The brisket takes 12 hours; the client gives up after 6 seconds with `DEADLINE_EXCEEDED`.
   - In the server terminal: 🍖 "customer gave up on the brisket; chef turned off the smoker". The deadline travels with the call, so the server stops working for a client that's gone. Your REST timeouts don't do that.

**Pitfall to mention:** don't make everything a stream because you can. Most business calls are unary, and unary is far easier to retry, cache, load balance and debug.

## Act 3: The debugging wall (3 min)

**The point:** gRPC is binary, so you need tools, and server reflection makes the tools easy.

Run `npm run act3`. It walks through five steps, so scroll slowly:

1. `fetch()` to the gRPC port gets "An HTTP/1.x request was sent to an HTTP/2 only endpoint." Your browser and `curl` habits stop here.
2. A raw HTTP/2 request, built by hand, gets 148 bytes back. Some words are visible, but the rest is gibberish. The first 5 bytes are gRPC framing: a compression flag and a length.
3. Decoding with no schema: field numbers and values, but no names. "Field 5 = 1" could mean anything. This is also what an old client sees when it receives a field it doesn't know about.
4. Decoding with the schema: the same bytes become a readable object.
5. `buf curl --list-methods` asks the server what it offers (reflection), then calls `GetMenuItem` with plain JSON.

**Say:** this is the "how do I Postman this?" answer. Turn on reflection in dev, then use `grpcurl`, `grpcui`, Postman or `buf curl`.

## Act 4: Payload size (3 min)

**The point:** the same data is a lot smaller as protobuf.

Run `npm run act4`.
- The table shows the same menu as REST JSON, protobuf's own JSON mapping, and binary protobuf. Binary is about 40% smaller here. Field names never travel, only numbers.
- The projection turns that into gigabytes a day at 1,000 calls a second.
- Be honest: our menu is mostly long joke strings, which are the same size in every encoding. Number-heavy messages (IDs, prices, timestamps) shrink far more. Gzip narrows the gap for large text bodies.
- There's deliberately no timing loop. On localhost there's no network, so a loop measures client-library overhead, not the protocol. If someone asks about speed, the honest answer is "measure it on your real network with your real messages".

**Joke on hand:** "Most of what's left is the jokes. Text compresses poorly when it's this funny."

## Act 5: Multiplexing (3 min)

**The point:** HTTP/2 carries many calls on one connection at once.

Run `npm run act5` and keep an eye on the server terminal.
- 100 concurrent gRPC calls: one 🔌 line in the server log, one TCP connection.
- 100 concurrent REST calls over HTTP/1.1: a wall of 🔌 lines, 100 connections. An HTTP/1.1 connection carries one request at a time.
- Each connection costs a TCP handshake, plus a TLS handshake in production, plus server memory. Browsers cap HTTP/1.1 at about 6 connections per host, so the rest queue.
- **Set up the next act:** "Remember that one connection. It's great for performance, and it's about to ruin someone's day."

## Act 6: The load-balancer trap (3 min, skip if behind)

**The point:** one long-lived connection defeats a connection-level load balancer.

Run `npm run act6`. It starts two kitchens (A and B) behind a round-robin TCP proxy, and stops them all again afterwards.
1. gRPC through the proxy: one connection, so kitchen A gets all 100 orders. "Kitchen A: chef is crying into the fryer. Kitchen B: chef is playing Candy Crush."
2. REST through the same proxy: 100 connections alternate, so it's 50/50.
3. The fix: the C# client with client-side round robin connects to both kitchens itself and spreads the calls, 50/50.
- Other fixes: an L7 proxy that understands HTTP/2 streams (Envoy, Linkerd, a cloud L7 load balancer), or a maximum connection age on the server so clients reconnect and rebalance.

## Act 7: Schema evolution (3 min)

**The point:** field numbers are forever.

Show `evolution/original/lunch_order.proto` and `evolution/renumbered/lunch_order.proto` side by side, then run `npm run act7`.
- The till writes 2 × Legacy Lasagne at $16 with the original schema. Four edited schemas then read the same bytes:
  - ✅ **added:** a new field on a new number. Old messages read fine.
  - ❌ **renumbered:** someone swapped 2 and 3 "to tidy up". You've now ordered 1,600 lasagnes at $0.02 each. No error, no warning.
  - ❌ **reused:** `ordered_at_unix` was deleted and its number given to `tip_cents`. The old timestamp is now a $17.9 million tip. The chef is thrilled. Finance is not.
  - ✅ **reserved:** the same deletion done properly, with `reserved 4; reserved "ordered_at_unix";` and the new field on 5.
- `buf breaking` passes the two safe edits and fails the two unsafe ones, with the exact line. Put it in CI and this can't ship.

**Say:** adding fields is free, renaming is mostly free, and changing or reusing a number is never safe. When you delete a field, reserve its number and name.

## Act 8: The browser (3 min)

**The point:** browsers can't speak raw gRPC, but gRPC-Web gets most of the way.

Run `npm run act8`. Vite opens the page at http://localhost:5173. Open the dev tools Network tab first.
1. **fetch() the gRPC port:** fails. The browser sends HTTP/1.1 and can't read HTTP/2 trailers anyway.
2. **Get the menu:** the same `LunchService` over gRPC-Web on port 5080. In the Network tab the request is a `POST` with `application/grpc-web+proto` and a binary body. The kitchen translates it with ASP.NET Core middleware, so there's no Envoy.
3. **Watch it cook:** server streaming works in the browser. Try the brisket for a deadline in the UI.
- gRPC-Web has no client streaming or bidirectional streaming. Those need real HTTP/2 control that browsers don't expose.
- In production you'd usually put gRPC-Web, or a REST/JSON gateway, at the edge, and keep native gRPC for service-to-service ("east-west") traffic.

Stop Vite with Ctrl+C when you're done.

## Act 9: Polyglot (2 min, skip if behind)

**The point:** the contract is the integration, and the language is an implementation detail.

Run `npm run act9`.
- It starts the Go food truck, a Go `GreeterService`. The TypeScript and C# clients greet it without any changes: "We only take cash, and errors are values."
- The Go diner then reads the C# kitchen's menu and watches a lasagne cook.
- Three languages, one `.proto` file, and nobody wrote any serialisation code.

## Q&A prompts (if the room is quiet)

- "Where would gRPC help in our own system, and where would it make things worse?"
- "Who's been burnt by a JSON contract drifting between two services?"
- Common questions:
  - **Is it faster?** On the wire it's smaller, and HTTP/2 saves connections. Measure with your own messages before promising a number.
  - **Can I use it from the front end?** Via gRPC-Web or a REST gateway at the edge. Native gRPC is for backends.
  - **What about versioning?** Add fields freely, never reuse numbers, put the version in the package name, and run `buf breaking` in CI.
  - **Auth?** Credentials go in call metadata (headers) over TLS, just like a bearer token on REST.
