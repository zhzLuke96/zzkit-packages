# @zzkit/wss-jsonrpc

@zzkit/wss-jsonrpc is a library for building decentralized, distributed systems using WebSocket and JSON-RPC.

## Key Features

- Worker nodes can listen for connections or connect to other nodes
- Nodes can call methods on other nodes using JSON-RPC over WebSocket
- Automatic reconnect and request retry logic
- Publish-subscribe pattern for broadcasting updates

## Usage

### Creating a node

Create a `WorkerNode` instance:

```js
const { WorkerNode } = require("@zzkit/wss-jsonrpc");

const node = new WorkerNode();
```

### Listening for connections

Call `listen()` to start accepting connections:

```js
node.listen({ port: 8080 });
```

### Connecting to other nodes

Call `connect()` with a WebSocket URL to connect, which returns a `PeerNode` instance:

```js
const url = "ws://example.com:8080";
const peerNode = node.connect(url);
```

The `PeerNode` can be used to interact with the connected node:

```js
// Call remote methods
const result = await peerNode.request("sum", [1, 2]);

// Send notifications
peerNode.notify("message", ["hello"]);
```

The node will automatically check node is alive.

```ts
if (peerNode.is_alive === true) {
  console.log(`peerNode alive.`);
}
```

> Note: The peer node will not automatically reconnect. Once the peer node is disconnected, it will be deleted from the connection pool of the work node, so the logic of automatic reconnection needs to be implemented by the upper layer

### Registering methods

Expose methods for other nodes to call using `method()`:

```js
node.method("sum", (a, b) => a + b);
```

### Calling remote methods

Use `request()` to call a method on all connected nodes:

```js
const results = await node.request("sum", [1, 2]);
```

### Broadcasting notifications

Use `notify()` to send an update to all nodes without expecting a response:

```js
node.notify("message", ["Hello!"]);
```

### Handling events

Subscribe to events like `connection`, `request`, `response`:

```js
node.events.on("request", (data, node) => {
  // ...
});
```

## Examples

```ts
import { WssJsonRPC } from "./src/WssJsonRPC";

const server = new WssJsonRPC.SevNode();

server.method("echo", ([msg], peer_node) => {
  console.log("receive:", msg);
  console.log(peer_node.peer_node_id);

  peer_node.events.once("disconnected", () => {
    console.log("disconnected", peer_node.peer_node_id);
  });
  return msg;
});

const port = 8080;
server.listen({
  host: "localhost",
  port,
});

server.events.on("connection", (socket, request) => {
  console.log("connection", request.url);
});

// client1.js

const main = async () => {
  {
    const client1 = new WssJsonRPC.SevNode();
    const peer_node1 = client1.connect(`ws://localhost:${port}/haha`);
    peer_node1.request("echo", ["hello from client1"]).then((resp) => {
      console.log(resp);
    });

    client1.subscribe("feedUpdated", () => {
      console.log("feedUpdated 1");
    });
  }
  {
    const client2 = new WssJsonRPC.SevNode();
    const peer_node2 = client2.connect(`ws://localhost:${port}`);
    peer_node2.request("echo", ["hello from client2"]).then((resp) => {
      console.log(resp);
    });
    client2.subscribe("feedUpdated", () => {
      console.log("feedUpdated 2");
      client2.close();
    });
  }

  setInterval(() => {
    server.broadcast("feedUpdated");
  }, 5 * 1000);
};

main();
```

## Contributing

Pull requests are welcome! Feel free to open issues for any bugs or feature requests.

## License

MIT
