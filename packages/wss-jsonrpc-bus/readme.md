# @zzkit/wss-jsonrpc-bus

WIP

# examples

```ts
import { CenterServer, ServiceNode } from "@zzkit/wss-jsonrpc-bus";

const main = async () => {
  const port = 8080;
  const center = new CenterServer();
  const sev1 = new ServiceNode(`ws://localhost:${port}`);
  const sev2 = new ServiceNode(`ws://localhost:${port}`);

  center.listen({
    port,
    host: "localhost",
  });

  await sev1.register("sum", (a, b) => {
    console.log({ a, b }, 1);
    return a + b;
  });
  await sev2.register("sum", (a, b) => {
    console.log({ a, b }, 2);
    return a + b;
  });

  //   sev1.close();
  await Promise.all([
    center.callService("sum", 1, 2).then((result) => console.log({ result })),
    center.callService("sum", 1, 2).then((result) => console.log({ result })),
    center.callService("sum", 1, 2).then((result) => console.log({ result })),
    center.callService("sum", 1, 2).then((result) => console.log({ result })),
  ]);

  sev1.close();

  console.log({ result: await center.callService("sum", 1, 2) });
  console.log({ result: await center.callService("sum", 1, 2) });
  console.log({ result: await center.callService("sum", 1, 2) });
  console.log({ result: await center.callService("sum", 1, 2) });

  center.close();
  sev2.close();
};

main().catch(console.error);
```


# License

Apache-2.0
