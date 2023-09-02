// 这个demo测试多次断开重连
import "./ensure-fetch";

import { CenterServer, ServiceNode, Sidecar } from "../dist/main";

import Fastify from "fastify";

const createExampleHttpServer = async () => {
  const port = 3000;
  const app = Fastify({
    // logger: true,
    logger: false,
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
    await new Promise((resolve, reject) =>
      setTimeout(resolve, 1000 * Math.random())
    );
    return a + b;
  });

  try {
    await app.listen({ port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  return { app, port };
};

const createCenterService = () => {
  const port = 8080;
  const center = new CenterServer();
  center.listen({
    port,
    host: "localhost",
  });
  return { center, port };
};

const createSidecar = async (center_url: string, base_url: string) => {
  const sidecar1 = new Sidecar.HttpSidecar(
    "func1",
    {
      center_url,
    },
    {
      base_url,
      service_path: "/func1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  await sidecar1.start();
  return sidecar1;
};

const setup_demo_env = async () => {
  const http_server = await createExampleHttpServer();
  const center_service = createCenterService();
  const sidecar = await createSidecar(
    `ws://localhost:${center_service.port}`,
    `http://localhost:${http_server.port}/`
  );

  return {
    http_server,
    center_service,
    sidecar,
  };
};

const main = async () => {
  const demo_env = await setup_demo_env();

  const body = {
    a: 1,
    b: 2,
  };

  const test_calls = () =>
    Promise.all([
      demo_env.center_service.center
        .callService("func1", body)
        .then(({ result }) => console.log(result)),
      demo_env.center_service.center
        .callService("func1", body)
        .then(({ result }) => console.log(result)),
      demo_env.center_service.center
        .callService("func1", body)
        .then(({ result }) => console.log(result)),
      demo_env.center_service.center
        .callService("func1", body)
        .then(({ result }) => console.log(result)),
    ]);

  const test_calls_sync = async () =>
    console.log([
      await demo_env.center_service.center.callService("func1", body),
      await demo_env.center_service.center.callService("func1", body),
      await demo_env.center_service.center.callService("func1", body),
      await demo_env.center_service.center.callService("func1", body),
      await demo_env.center_service.center.callService("func1", body),
    ]);

  const closeHttpServer = async () => {
    demo_env.http_server.app.close();
    console.log("http server closed");
  };

  const closeCenterService = async () => {
    demo_env.center_service.center.dispose();
    console.log("center service closed");
  };

  const restartHttpServer = async () => {
    await closeHttpServer();
    demo_env.http_server = await createExampleHttpServer();
    console.log("http server restarted");
  };

  const restartCenterService = async () => {
    await closeCenterService();
    demo_env.center_service.center.dispose();
    demo_env.center_service = createCenterService();
    console.log("center service restarted");
  };

  console.time("test_calls");
  await test_calls();
  console.timeEnd("test_calls");

  console.time("test_calls_sync");
  await test_calls_sync();
  console.timeEnd("test_calls_sync");

  console.time("重启http服务");
  await restartHttpServer();
  await test_calls();
  console.timeEnd("重启http服务");

  console.time("重启中心服务");
  await restartCenterService();
  await test_calls();
  console.timeEnd("重启中心服务");

  // close
  closeCenterService();
  closeHttpServer();

  const dispose = () => {
    const { center_service, http_server, sidecar } = demo_env;
    center_service.center.dispose();
    http_server.app.close();
    sidecar.dispose();
  };
  // dispose
  dispose();
};

main().catch(console.error);
