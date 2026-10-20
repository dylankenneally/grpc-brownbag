# gRPC brown bag 🥪

Runnable demos that introduce gRPC to developers who have never used it. Every demo is themed around ordering lunch: C#, TypeScript, Go and a web browser all order from each other using one shared set of `.proto` contracts.

- New to gRPC? Start with the background notes in [brown-bag-run-sheet.md](brown-bag-run-sheet.md).
- Presenting the session? Use [docs/runbook.md](docs/runbook.md).

> ⚠️ These are localhost demos. The servers have **no authentication and no TLS**, and the browser-facing port accepts calls from any localhost origin. Don't copy them into anything that leaves your machine. Production gRPC runs over TLS behind real authentication.

## Quick start

```sh
git clone <this repo>
cd grpc-brownbag
npm run doctor   # checks your tools and tells you what's missing and where to get it
npm run setup    # installs packages, generates code from the .proto files, builds C# and Go
```

Then use two terminals:

```sh
# terminal 1: start the C# kitchen and leave it running
npm run server

# terminal 2: run any act
npm run act1
```

`npm run doctor` only needs Node.js, so it works before anything else is installed. `npm run setup` runs it first and stops if a required tool is missing. It's safe to re-run.

## Prerequisites

Install these yourself. `npm run doctor` checks each one.

| Tool | Version | Needed for | Get it | macOS (Homebrew) |
|------|---------|------------|--------|------------------|
| [Node.js](https://nodejs.org/) | 22.13 or later (24 LTS recommended) | npm scripts, the TypeScript client, the demo tools and the browser page | [nodejs.org/en/download](https://nodejs.org/en/download) | `brew install node@24` |
| [.NET SDK](https://dotnet.microsoft.com/) | 10.0 | The C# kitchen (server) and C# client | [dotnet.microsoft.com/download/dotnet/10.0](https://dotnet.microsoft.com/download/dotnet/10.0) | `brew install --cask dotnet-sdk` |
| [Go](https://go.dev/) | 1.25 or later | The Go food truck and diner (act 9 only; everything else works without it) | [go.dev/dl](https://go.dev/dl/) | `brew install go` |
| [Git](https://git-scm.com/) | any recent | Cloning the repo | [git-scm.com/downloads](https://git-scm.com/downloads) | `brew install git` |
| A modern browser | any current Chrome, Edge, Firefox or Safari | The browser demo (act 8) | | |

These are optional. The demos don't need them, but you'll see them in blog posts and docs:

| Tool | What it is | Get it | macOS (Homebrew) |
|------|------------|--------|------------------|
| [grpcurl](https://github.com/fullstorydev/grpcurl) | `curl` for gRPC on the command line | [GitHub releases](https://github.com/fullstorydev/grpcurl/releases) | `brew install grpcurl` |
| [grpcui](https://github.com/fullstorydev/grpcui) | A browser-based UI for calling gRPC services | [GitHub releases](https://github.com/fullstorydev/grpcui/releases) | `brew install grpcui` |
| [Postman](https://www.postman.com/) | Supports gRPC requests alongside REST | [postman.com/downloads](https://www.postman.com/downloads/) | `brew install --cask postman` |

Both kitchens have server reflection on, so these tools work without being given the `.proto` files, for example `grpcurl -plaintext localhost:5051 list` or `grpcui -plaintext localhost:5051`.

### Installed for you

`npm run setup` fetches everything else, pinned to exact versions, so you don't install any of it by hand.

| Tool | Version | What it does | Comes from |
|------|---------|--------------|------------|
| [Buf CLI](https://buf.build/docs/cli/) | 1.74.0 | Lints `.proto` files, runs code generation, checks for breaking changes, calls services (`buf curl`) | npm: `@bufbuild/buf` |
| [protoc-gen-es](https://github.com/bufbuild/protobuf-es) | 2.16.0 | Generates TypeScript from `.proto` files | npm: `@bufbuild/protoc-gen-es` |
| [Protobuf-ES](https://github.com/bufbuild/protobuf-es) | 2.16.0 | Protobuf runtime for TypeScript | npm: `@bufbuild/protobuf` |
| [Connect-ES](https://connectrpc.com/docs/node/getting-started) | 2.2.0 | gRPC client for Node (`connect-node`) and gRPC-Web client for browsers (`connect-web`) | npm: `@connectrpc/connect`, `@connectrpc/connect-node`, `@connectrpc/connect-web` |
| [Vite](https://vite.dev/) | 8.3.4 | Dev server for the browser page | npm: `vite` |
| [tsx](https://tsx.is/) | 4.23.15 | Runs TypeScript directly, with no build step | npm: `tsx` |
| [TypeScript](https://www.typescriptlang.org/) | 6.0.3 | Type checking | npm: `typescript` |
| [ESLint](https://eslint.org/) + [typescript-eslint](https://typescript-eslint.io/) | 10.13.0 / 8.72.0 | Linting | npm: `eslint`, `typescript-eslint` |
| [Grpc.AspNetCore](https://learn.microsoft.com/aspnet/core/grpc/) | 2.84.0 | gRPC server for ASP.NET Core | NuGet |
| [Grpc.AspNetCore.Web](https://learn.microsoft.com/aspnet/core/grpc/grpcweb) | 2.84.0 | gRPC-Web support, so browsers can call the kitchen without a proxy | NuGet |
| [Grpc.AspNetCore.Server.Reflection](https://learn.microsoft.com/aspnet/core/grpc/test-tools) | 2.84.0 | Server reflection, so tools can discover the API | NuGet |
| [Grpc.Net.Client](https://learn.microsoft.com/aspnet/core/grpc/client) | 2.84.0 | gRPC client for .NET, including client-side load balancing | NuGet |
| [Grpc.Tools](https://github.com/grpc/grpc/blob/master/src/csharp/BUILD-INTEGRATION.md) | 2.84.0 | Generates C# from `.proto` files during `dotnet build`, with `protoc` bundled | NuGet |
| [Google.Protobuf](https://protobuf.dev/reference/csharp/) | 3.36.2 | Protobuf runtime for .NET | NuGet |
| [grpc-go](https://grpc.io/docs/languages/go/) | 1.84.0 | gRPC for Go | Go module: `google.golang.org/grpc` |
| [protobuf-go](https://protobuf.dev/reference/go/) | 1.36.12 | Protobuf runtime for Go, plus `protoc-gen-go` | Go module: `google.golang.org/protobuf` |
| [protoc-gen-go-grpc](https://pkg.go.dev/google.golang.org/grpc/cmd/protoc-gen-go-grpc) | 1.6.2 | Generates Go service stubs | Go module, pinned as a `tool` in `go/go.mod` |

You never need to install `protoc` (the Protocol Buffers compiler) yourself. Buf drives the TypeScript and Go plugins, and Grpc.Tools bundles `protoc` for C#. The Go plugins run with `go tool`, so they don't need to be on your `PATH` either.

## The demos

Each demo ("act") is one command, run while `npm run server` is up in another terminal. Acts 6 and 7 don't need the server.

| Act | Command | What it shows |
|-----|---------|---------------|
| 1. Hello gRPC | `npm run act1` | One `.proto` file, a C# server, and C# and TypeScript clients calling it like a local function |
| 2. Four patterns | `npm run act2` | Unary, server streaming and client streaming, then a 12-hour brisket that blows a 6-second deadline |
| 2b. Bidirectional chat | `npm run chat:cs -- Ada` and `npm run chat:ts -- Grace` in two terminals | Both sides of one call talking at once, plus a bot |
| 3. The debugging wall | `npm run act3` | What's actually on the wire, decoding it by hand, then `buf curl` with server reflection |
| 4. Payload size | `npm run act4` | The same menu as REST/JSON and as protobuf, byte for byte |
| 5. Multiplexing | `npm run act5` | 100 concurrent gRPC calls on 1 TCP connection; 100 REST calls on 100 |
| 6. Load-balancer trap | `npm run act6` | Two kitchens behind a TCP load balancer: gRPC piles onto one, REST spreads; then the fix |
| 7. Schema evolution | `npm run act7` | Safe and unsafe `.proto` edits reading the same bytes, and `buf breaking` catching the bad ones |
| 8. The browser | `npm run act8` | Opens a page that fails with `fetch()`, then orders lunch over gRPC-Web |
| 9. Polyglot | `npm run act9` | TypeScript and C# greet a Go server; a Go client orders from the C# kitchen |

Each part of act 2 also runs on its own: `npm run act2:unary`, `act2:server-stream`, `act2:client-stream` and `act2:deadline`.

### Running the clients yourself

Both console clients take the same commands. Prefix with `npm run cs --` for C# or `npm run ts --` for TypeScript:

| Command | Pattern | Example |
|---------|---------|---------|
| `greet [name]` | unary | `npm run ts -- greet Ada` |
| `menu` | unary | `npm run cs -- menu` |
| `item <id>` | unary, or `NOT_FOUND` | `npm run ts -- item caviar` |
| `watch <id>` | server streaming, 6 s deadline | `npm run cs -- watch brisket` |
| `team` | client streaming | `npm run ts -- team` |
| `chat [name]` | bidirectional streaming | `npm run cs -- chat Ada` |
| `lb-fix <port> <port>` | client-side load balancing (C# only) | used by act 6 |

Pass a blank name (`npm run act1:ts -- " "`) to see a gRPC error. Dish ids are in [InMemoryMenu.cs](dotnet/Server/Domain/InMemoryMenu.cs).

## How code generation works

The `.proto` files in [proto/](proto/) are the single source of truth. Nobody hand-writes a client, a server stub or a serialiser.

```
proto/lunch/v1/lunch.proto
  ├─ dotnet build      (Grpc.Tools)                → C# server base classes + C# clients, in dotnet/*/obj/
  ├─ npm run generate  (buf + protoc-gen-es)       → TypeScript, in node/client/src/gen, node/tools/src/gen, web/src/gen
  └─ npm run generate  (buf + protoc-gen-go[-grpc]) → Go, in go/gen (skipped if Go isn't installed)
```

Generated code is git-ignored. After editing a `.proto` file, run `npm run generate` and `npm run build` (and `npm run build:go`), or just `npm run setup` again.

The [evolution/](evolution/) folder holds five versions of one small message for act 7. They're deliberately kept out of `proto/`, because they redefine the same message.

## Repository layout

```
proto/                    the .proto contracts every language shares
  greeter/v1/             act 1
  lunch/v1/               acts 2 to 9
evolution/                one message, edited five ways (act 7)
dotnet/
  Server/                 the C# kitchen: gRPC, gRPC-Web, reflection and a REST API in one ASP.NET Core app
    Domain/               menu, kitchen and chat room logic, behind interfaces
    Services/             the gRPC services (thin: validate, call the domain, map)
    Http/                 REST endpoints and the demo logging middleware
  Client/                 C# console client
node/
  client/                 TypeScript console client (Connect-ES)
  tools/                  the scripts behind acts 3 to 7 and 9
web/                      browser page (Vite + Connect-ES over gRPC-Web)
go/
  cmd/foodtruck/          Go GreeterService server
  cmd/diner/              Go LunchService client
scripts/                  doctor, setup and generate
docs/runbook.md           presenter script
buf.yaml                  proto lint and breaking-change rules
buf.gen.yaml              TypeScript code generation
buf.gen.go.yaml           Go code generation
```

## npm scripts

| Script | What it does |
|--------|--------------|
| `npm run doctor` | Checks prerequisites and that the demo ports are free |
| `npm run setup` | `doctor`, then install, generate and build everything. Safe to re-run |
| `npm run generate` | Regenerates TypeScript and Go from the `.proto` files |
| `npm run build` | Builds the C# solution, regenerating C# from `proto/` |
| `npm run build:go` | Builds the Go programs into `go/bin/` |
| `npm run server` | Starts the C# kitchen |
| `npm run cs -- …` / `npm run ts -- …` | Runs the C# or TypeScript client |
| `npm run actN` | Runs demo act N |
| `npm run lint` | ESLint plus `buf lint` |
| `npm run typecheck` | Type-checks all the TypeScript and the scripts |

## Ports

| Port | Used by |
|------|---------|
| 5051 | C# kitchen, native gRPC (plaintext HTTP/2) |
| 5080 | C# kitchen, gRPC-Web and REST `/api/v1/menu` (HTTP/1.1) |
| 5052 | Go food truck (act 9) |
| 5060, 5070 | Round-robin TCP proxy for gRPC and REST (act 6) |
| 5061, 5071 / 5062, 5072 | Kitchens A and B, gRPC / REST (act 6) |
| 5173 | Browser page dev server (act 8) |

Point a console client somewhere else with the `LUNCH_SERVER` environment variable, for example `LUNCH_SERVER=http://localhost:5052 npm run ts -- greet`. The browser page reads `VITE_LUNCH_SERVER`.

## Editor setup

- **VS Code:** [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit), [Go](https://marketplace.visualstudio.com/items?itemName=golang.go) and the [Buf extension](https://marketplace.visualstudio.com/items?itemName=bufbuild.vscode-buf), which adds `.proto` syntax highlighting, linting and go-to-definition.
- **Rider / Visual Studio:** open `dotnet/BrownBag.slnx`. Both pick up the generated C# after one build.

Open a generated file (`node/client/src/gen/lunch/v1/lunch_pb.ts`, or press F12 on `GetMenuItemRequest` in C#) to see what the compiler wrote for you.

## Troubleshooting

- **Port in use.** Run `npm run doctor` to see which port. On Windows, Hyper-V and WSL can reserve port blocks; list them with `netsh interface ipv4 show excludedportrange protocol=tcp`.
- **`curl` or a browser gets an error from port 5051.** That's expected. The port only speaks gRPC over HTTP/2. Use `buf curl`, `grpcurl` or port 5080 instead.
- **A C# change doesn't show up.** The npm scripts use `dotnet run --no-build` so the demos start fast. Run `npm run build` after changing C# or `.proto` files.
- **`npm run build` fails with "file is locked" (Windows).** The kitchen is still running. Stop `npm run server` with Ctrl+C, then build again.
- **Act 9 says the Go programs are missing.** Install Go, then run `npm run setup` again.
- **`dotnet` or `go` not found on macOS after installing.** Open a new terminal so it picks up the updated `PATH`.

## Learn more

- [gRPC](https://grpc.io/docs/): concepts, guides and every language
- [Protocol Buffers](https://protobuf.dev/): the language guide, and [the encoding](https://protobuf.dev/programming-guides/encoding/) act 3 decodes by hand
- [gRPC on .NET](https://learn.microsoft.com/aspnet/core/grpc/): Microsoft's docs for ASP.NET Core gRPC, gRPC-Web and client-side load balancing
- [Connect-ES](https://connectrpc.com/docs/web/getting-started): the TypeScript library used here
- [Buf](https://buf.build/docs/): proto linting, generation and [breaking-change detection](https://buf.build/docs/breaking/)
