import "./ensure-fetch";

import { CenterServer, ServiceNode, Sidecar } from "../dist/main";

import Fastify from "fastify";

const start_example = async () => {
  const port = 3000;
  const app = Fastify({
    logger: true,
  });

  app.get("/ping", async function handler(request, reply) {
    return "pong";
  });
  app.post<{
    Body: {
      a: number;
      b: number;
    };
  }>("/func1", async function handler(request, reply) {
    const { a, b } = request.body;
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));
    return a + b;
  });

  const relisten = async () => {
    try {
      await app.listen({ port });
    } catch (err) {
      app.log.error(err);
    }
  };

  try {
    await app.listen({ port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  return { app, port, relisten };
};

const main = async () => {
  const sev1 = await start_example();

  const port = 8080;
  const center = new CenterServer();
  center.listen({
    port,
    host: "localhost",
  });

  const sidecar1 = new Sidecar.HttpSidecar(
    "func1",
    {
      center_url: `ws://localhost:${port}`,
    },
    {
      base_url: `http://localhost:${sev1.port}/`,
      service_path: "/func1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  await sidecar1.start();

  const body = {
    a: 1,
    b: 2,
  };

  //   sev1.close();
  await Promise.all([
    center.callService("func1", body).then(({ result }) => console.log(result)),
    center.callService("func1", body).then(({ result }) => console.log(result)),
    center.callService("func1", body).then(({ result }) => console.log(result)),
    center.callService("func1", body).then(({ result }) => console.log(result)),
  ]);

  sev1.app.close();

  setTimeout(async () => {
    const sev1 = await start_example();

    setTimeout(() => {
      sev1.app.close();
    }, 10 * 1000);
  }, 10 * 1000);

  console.log(await center.callService("func1", body));
  console.log(await center.callService("func1", body));
  console.log(await center.callService("func1", body));
  console.log(await center.callService("func1", body));

  center.close();
};

main().catch(console.error);
