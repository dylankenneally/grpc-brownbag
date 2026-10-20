# gRPC

## Overview

**gRPC** (gRPC Remote Procedure Calls) is a modern, open-source high-performance Remote Procedure Call framework originally developed by Google. It allows a client application to directly call methods on a server application on a different machine as if it were a local object.

---

### Key Concepts and Architecture

1. **Protocol Buffers (Protobuf):**
* Instead of using human-readable text formats like JSON or XML, gRPC uses Google's interface definition language (IDL), **Protocol Buffers**.
* You define your data structures and service contracts in `.proto` files.
* A compiler (`protoc`) then generates native code for multiple programming languages (e.g., Python, Go, Java, Node.js, C++), providing automatic serialization into compact binary payloads.


2. **HTTP/2 Transport Layer:**
* Unlike traditional REST APIs which typically rely on HTTP/1.1, gRPC runs on **HTTP/2**.
* This enables advanced features like **multiplexing** (sending multiple requests and responses concurrently over a single TCP connection), header compression, and full bidirectional streaming.


3. **Four Communication Patterns:**
gRPC natively supports four types of service methods:
* **Unary:** Standard request and single response (like a typical HTTP request).
* **Server Streaming:** The client sends one request, and the server returns a stream of responses.
* **Client Streaming:** The client sends a stream of requests, and the server responds with a single response.
* **Bidirectional Streaming:** Both client and server send a stream of messages independently and concurrently.



---

### Why Use gRPC? (Pros & Cons)

* **Advantages:**
* **High Performance:** Binary serialization and HTTP/2 multiplexing result in significantly smaller message sizes and faster processing times than JSON/REST.
* **Strong Typing:** The `.proto` schema acts as a single source of truth, reducing runtime errors and mismatches between microservices.
* **Polyglot:** Excellent cross-language support makes it ideal for polyglot microservice environments.


* **Disadvantages:**
* **Not Human-Readable:** Because data is transferred in binary format, debugging requires specific tooling (like gRPC UI or `grpcurl`) rather than a simple browser look or `curl` command.
* **Browser Limitations:** Calling gRPC directly from a web browser requires a proxy layer (like gRPC-Web) because standard browsers do not grant low-level control over HTTP/2 frames.



---

### Example: A Simple `.proto` File

Here is what a basic gRPC service definition looks like:

```protobuf
syntax = "proto3";

package greeter;

// The greeting service definition.
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings.
message HelloReply {
  string message = 1;
}

```

## More about how it is different from other RPC schemes, including REST, SOAP & DCOM

To understand how **gRPC** stands out, it helps to compare it against other prominent RPC and API communication paradigms: **REST**, **SOAP**, and **DCOM**.

While they all aim to let different software systems talk to each other, they stem from completely different eras, design philosophies, and architectural styles.

---

### 1. gRPC vs. REST (Representational State Transfer)

REST is currently the dominant standard for public web APIs, whereas gRPC is optimized for high-performance internal microservices.

* **Mental Model:**
* **REST** is *resource-oriented*. You interact with nouns and URLs (e.g., `GET /users/123` or `POST /orders`) using standard HTTP verbs.
* **gRPC** is *action- or function-oriented*. You call remote methods directly as if they were local functions (e.g., `GetUser(123)`).


* **Data Format:** REST typically transmits human-readable text (JSON or XML). gRPC serializes data into compact, rigid **binary payloads** via Protocol Buffers.
* **Transport:** REST usually relies on **HTTP/1.1** (though it can use HTTP/2), processing one request-response cycle per connection at a time. gRPC is built natively on **HTTP/2**, allowing multiplexing (many requests/responses concurrently on one TCP connection) and native **bidirectional streaming**.
* **Debugging:** REST wins easily here—you can test it using a web browser, `curl`, or Postman. gRPC requires specialized tooling (like `grpcurl` or BloomRPC) because the binary format isn't human-readable.

---

### 2. gRPC vs. SOAP (Simple Object Access Protocol)

SOAP is a heavyweight, strict enterprise messaging protocol created in the late 1990s.

* **Mental Model:** Both SOAP and gRPC enforce strict contracts, but they handle them differently. SOAP uses WSDL (Web Services Description Language) XML files to define service shapes, while gRPC uses `.proto` files.
* **Data Format & Overhead:** SOAP is strictly **XML-based**, making messages notoriously verbose, heavy, and CPU-intensive to parse. gRPC’s binary Protobuf format results in significantly smaller payloads and lightning-fast serialization/deserialization.
* **Flexibility & Transport:** SOAP can run over multiple transport protocols (HTTP, SMTP, TCP). gRPC is strictly tied to HTTP/2. However, SOAP includes built-in, rigid enterprise standards for security (WS-Security), transactions, and reliability, whereas gRPC relies more on standard transport security (TLS) and application-level logic.
* **Modern Relevance:** SOAP is largely considered legacy tech and is mostly found in older enterprise, banking, or government integrations. gRPC is a modern choice for high-speed cloud-native architectures.

---

### 3. gRPC vs. DCOM (Distributed Component Object Model)

DCOM is a legacy Microsoft technology introduced in 1996 to allow COM (Component Object Model) objects to communicate across different computers over a network.

* **Mental Model:** DCOM was an early attempt at true "location transparency"—making a remote object look and feel precisely like a local object in languages like C++ or Visual Basic. gRPC also provides remote procedure calls, but it is language-agnostic and explicitly designed for modern web and cloud networks.
* **Ecosystem & Platform:** DCOM is deeply tied to the **Windows operating system** and Windows networking protocols (relying heavily on DCE/RPC). gRPC is completely **cross-platform and polyglot**, running seamlessly across Linux, Windows, macOS, and containers, supporting dozens of programming languages.
* **Web and Firewall Friendliness:** DCOM is notoriously difficult to configure across modern networks, firewalls, and the internet because it uses dynamic ports and complex Windows-specific RPC bindings. gRPC operates cleanly over standard web infrastructure (**HTTP/2 ports like 443**), making it cloud-native friendly.
* **Modern Relevance:** DCOM is functionally obsolete and heavily deprecated due to severe security vulnerabilities and its inability to fit into modern distributed cloud architectures.

---

### Summary Comparison Table

| Feature | REST | gRPC | SOAP | DCOM |
| --- | --- | --- | --- | --- |
| **Primary Era** | 2000s–Present | 2015–Present | Late 1990s–2000s | Late 1990s |
| **Architectural Style** | Resource-based (CRUD) | Procedure/Action-based | Protocol / Messaging | Object-oriented RPC |
| **Data Format** | JSON (usually) / XML | Binary (Protocol Buffers) | XML (Strict) | Binary (Windows-specific) |
| **Transport Protocol** | HTTP/1.1 or HTTP/2 | HTTP/2 | HTTP, SMTP, TCP, etc. | DCE/RPC (Windows network) |
| **Streaming Support** | Limited (WebSockets/SSE added) | Native (Client, Server, Bidi) | WS-ReliableMessaging | Limited / COM events |
| **Human Readable?** | Yes | No (Requires tools) | Verbose XML | No |
| **Primary Use Case** | Public APIs, Web/Mobile frontends | Internal Microservices | Enterprise / Legacy systems | Legacy Windows desktop apps |

## More about where it sits in modern software architecture

In modern software architecture, **gRPC** primarily serves as the high-performance backbone for **internal microservices communication**, sitting neatly between your application logic and the underlying transport networks.

The accompanying architectural diagram illustrates this positioning through two distinct lenses: a **horizontal layered stack** (how gRPC is built from the ground up) and a **microservices interaction diagram** (how gRPC connects distributed services in the real world).

---

### 1. The Horizontal Layered Stack (How gRPC is Built)

Looking at the left side of the diagram, gRPC isn't just a single protocol—it is a layered framework built on top of standard networking primitives:

* **Layer 1: Transport & Security:** At the bottom sits standard **TCP/IP** and **TLS encryption**, establishing secure, reliable connections across networks.
* **Layer 2: gRPC Core (HTTP/2):** This layer implements **HTTP/2**, providing critical performance features like multiplexing (sending multiple concurrent streams over one TCP connection), flow control, and header compression.
* **Layer 3: gRPC Framework (Stubs & Serialization):** This is where the magic happens. Using `.proto` interface definitions, the framework generates client and server **stubs** and handles the heavy lifting of **Protocol Buffers serialization/deserialization** (turning objects into compact binary payloads).
* **Layer 4: Application Code:** At the top layer sits your actual business logic written in various languages (e.g., Go, Node.js, Python, Java) interacting seamlessly through gRPC calls.

---

### 2. The Microservices Interaction Map (Where gRPC Sits in the Enterprise)

Looking at the right side of the diagram, we can see how gRPC fits into a distributed cloud-native architecture:

* **The Internal Service Mesh (East-West Traffic):** This is gRPC's primary domain. Inside the private network, various microservices written in different languages (such as a Go frontend talking to a Java user profile service or a Python order processor) talk to one another using different gRPC communication patterns—like Unary requests, Server Streaming, or Bidirectional Streaming—all backed by `.proto` contracts.
* **The Edge / API Gateway (North-South Traffic):** Because standard web browsers and mobile apps cannot natively speak raw HTTP/2 gRPC without extra tooling, public-facing traffic typically hits an **Edge Proxy or API Gateway** (like Envoy or Nginx). The gateway translates external REST/JSON requests or gRPC-Web traffic from clients into high-performance internal gRPC calls across the cluster.

### Summary

In short, while **REST** or **GraphQL** usually handles the "North-South" traffic coming from end-users and frontends, **gRPC** dominates the "East-West" traffic—the high-speed, internal chatter between backend microservices where low latency and strict typing are paramount.

## More about using it with AWS

Running gRPC on Amazon Web Services (AWS) is common for enterprise microservices, but because gRPC relies heavily on **HTTP/2** and binary payloads, you have to configure your networking and load balancing differently than you would for standard REST/JSON services.

---

### 1. Load Balancing gRPC (The Elastic Load Balancer Family)

Because gRPC uses a single long-lived TCP connection for HTTP/2 multiplexing, traditional layer 7 load balancers that distribute individual requests per-connection can run into trouble (sending all concurrent streams from one client to a single backend pod). AWS addresses this through specific load balancing options:

* **Application Load Balancer (ALB):**
* ALB natively supports HTTP/2 and can route gRPC traffic.
* It can inspect gRPC methods and route traffic based on the package, service, or method name.
* **Requirement:** You must configure your target groups to use **HTTP/2** as the protocol version.


* **Network Load Balancer (NLB):**
* Operates at Layer 4 (TCP).
* Because it passes raw TCP connections through without inspecting HTTP frames, it effortlessly handles HTTP/2 multiplexing and achieves the absolute lowest latency. It is heavily used for high-throughput internal gRPC service meshes.



---

### 2. Compute Platforms: Running gRPC on AWS

You can deploy gRPC services across almost any compute layer on AWS:

* **Amazon ECS & AWS Fargate:**
* Containers running Go, Node.js, Python, or Java can expose gRPC ports.
* If using Fargate, you pair your tasks with an ALB or NLB using IP target types.


* **Amazon EKS (Kubernetes):**
* One of the most popular environments for gRPC microservices.
* You can expose gRPC services using the **AWS Load Balancer Controller** via Kubernetes Ingress or Gateway API resources, routing traffic cleanly to your pods.


* **AWS Lambda:**
* Traditionally, Lambda functions were difficult to invoke via gRPC because Lambda's invocation model historically expected HTTP/1.1 JSON payloads. However, AWS API Gateway supports HTTP APIs with gRPC/REST mapping, and Lambda functions can act as gRPC clients or servers if wrapped correctly (though gRPC's long-lived streaming model doesn't map cleanly to short-lived serverless functions).



---

### 3. Service Meshes and Advanced Routing (AWS App Mesh & VPC Lattice)

When you have dozens or hundreds of microservices talking to each other via gRPC internally, managing `.proto` updates and routing rules can become complex. AWS provides infrastructure solutions for this:

* **AWS App Mesh:**
* Powered by the Envoy proxy, App Mesh allows you to manage gRPC traffic control, retries, timeouts, and canary deployments without changing your application code.
* It natively handles Envoy sidecars that speak gRPC to one another across EKS, ECS, and EC2.


* **Amazon VPC Lattice:**
* A modern application networking service that simplifies connecting, securing, and monitoring services across different accounts and VPCs.
* It supports gRPC routing out of the box, allowing you to define traffic policies using service names rather than raw IP addresses or ports.



---

### 4. External Clients and Browser Access (gRPC-Web)

If your frontend (a React/Vue single-page app or a mobile app) needs to talk to your AWS backend via gRPC, standard web browsers cannot send raw HTTP/2 framing required by gRPC.

To solve this on AWS, developers typically place an **Envoy proxy** or an **API Gateway** layer at the edge. The browser client sends standard HTTP/1.1 or gRPC-Web requests to the gateway, which translates them into high-performance internal gRPC/HTTP/2 calls heading toward your backend microservices cluster.

## Common pitfalls developers that are new to gRPC might encounter

Developers transitioning from REST/JSON to **gRPC** often encounter a specific set of hurdles as their mental models clash with how HTTP/2 and binary serialization actually operate.

---

### Part 1: Common Pitfalls for New gRPC Developers

1. **Treating `.proto` Files Like Casual JSON Schemas**
* **The Pitfall:** Developers sometimes treat Protocol Buffers like flexible JSON objects, adding or changing field numbers haphazardly, or deleting fields because "nobody is using them right now."
* **Why it hurts:** Protobuf relies heavily on **field numbers** (e.g., `string name = 1;`) rather than field names for binary serialization. If you change a field number or reuse an old tag, clients and servers will silently misinterpret data or crash. Furthermore, removing a field requires marking it as `reserved` to prevent future developers from accidentally reusing that tag number.


2. **Expecting Browser Support Out of the Box**
* **The Pitfall:** Writing a full gRPC backend and then trying to fetch it directly from a React or Vue frontend using standard browser `fetch()` or `axios`.
* **Why it hurts:** Standard web browsers do not give developers low-level control over HTTP/2 framing required by core gRPC. Without configuring an intermediary proxy (like Envoy for gRPC-Web) or specific connection setups, browser calls will fail immediately.


3. **Ignoring Connection Management (The "Load Balancer" Trap)**
* **The Pitfall:** Putting a standard Layer 7 round-robin load balancer in front of gRPC servers and expecting requests to spread evenly across all backend instances.
* **Why it hurts:** Because gRPC uses long-lived HTTP/2 connections, multiplexing hundreds of concurrent requests over a single TCP connection means the load balancer sees only *one* connection. It will route all concurrent streams to a single backend container, starving the rest of your cluster. (Proper configuration requires client-side load balancing or a Layer 4 NLB / specialized L7 proxy like Envoy).


4. **The Debugging Wall (No More `curl` or Browser Inspector)**
* **The Pitfall:** Trying to inspect API payloads by looking at network tabs or running simple `curl` commands.
* **Why it hurts:** Protobuf payloads are compressed binary bytes, looking like gibberish in standard text editors or terminal logs. New developers often get stuck until they learn to incorporate specialized CLI tools like `grpcurl`, GUI clients like BloomRPC/Postman, or enable server reflection so tools can inspect the service schema dynamically.


5. **Overusing Streaming Where Unary Suffices**
* **The Pitfall:** Designing every single endpoint as a bidirectional stream because "gRPC supports streaming and it sounds faster."
* **Why it hurts:** Streaming adds unnecessary architectural complexity, harder error handling, memory management overhead, and complicates load balancing. Most business logic works best—and is much easier to debug—as a standard Unary request/response.



---

## Common "ah ha" moments developers have with gRPC

### Part 2: The "Aha!" Moments

Once developers get past the initial learning curve, gRPC usually triggers a few distinct paradigm shifts or "aha!" moments:

1. **"The `.proto` file is the ultimate source of truth."**
* **The Moment:** Instead of writing tedious API documentation in Swagger/OpenAPI, manually writing TypeScript interfaces, and double-checking Python data classes, you write *one* `.proto` file and run the compiler.
* **The Realization:** Frontend and backend teams stop arguing over payload contracts. The schema *is* the code generation engine. Client and server SDKs are always in sync automatically, eliminating an entire category of human error.


2. **"Wait, it's just local function calls across the network."**
* **The Moment:** Looking at generated client code where you call `client.GetUser(request)` and get a strongly typed object back immediately, complete with IDE autocomplete.
* **The Realization:** The friction of manual JSON parsing, mapping dictionary keys, and writing serialization boilerplate vanishes. Distributed microservices suddenly feel as clean and cohesive as a monolithic application with modular packages.


3. **"Look at how much data we just saved."**
* **The Moment:** Comparing network payloads or observing CPU utilization metrics after migrating a high-throughput internal communication loop from bloated JSON/HTTP/1.1 to binary Protobuf/HTTP/2.
* **The Realization:** The raw speed and compactness of binary serialization become glaringly obvious, especially in data-heavy pipelines or resource-constrained environments. Network bandwidth drops significantly, and serialization CPU overhead plummets.


4. **"Multiplexing changes everything about concurrency."**
* **The Moment:** Realizing that multiple distinct threads can fire requests down a single TCP connection simultaneously without blocking each other or tearing down sockets.
* **The Realization:** The underlying efficiency of HTTP/2 makes high-frequency internal microservice chatter feel instantaneous compared to the connection-churn penalty of traditional REST APIs.
