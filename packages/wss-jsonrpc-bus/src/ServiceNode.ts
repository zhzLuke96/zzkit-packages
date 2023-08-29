import { WssJsonRPC } from "@zzkit/wss-jsonrpc";
import { CenterInternalService } from "./types";

import debug from "debug";

const log = debug("wss-jsonrpc-bus:service-node");

async function retry<T>(
  fn: () => Promise<T>,
  options: {
    times: number;
    delayMS: number;
    exceeded_error?: Error;
  }
) {
  const { times, delayMS, exceeded_error } = options;

  let last_error: Error | undefined;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      last_error = err;
      log(`retry ${i} times, error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMS));
    }
  }

  throw exceeded_error || last_error || new Error("Exceeded retry times");
}

export interface ServiceNodeOptions {
  center_url: string;
  retry_times?: number;
  retry_interval?: number;
}

export class ServiceNode {
  worker = new WssJsonRPC.WorkerNode();
  center_node?: Promise<WssJsonRPC.PeerNode>;

  constructor(readonly options: ServiceNodeOptions) {
    this.center_node = this.connectCenterNode();
  }

  async connectCenterNode() {
    const {
      retry_interval = 1000,
      retry_times = 30,
      center_url,
    } = this.options;

    const center_node = await retry(
      async () => {
        const center_node = this.worker.connect(center_url);
        center_node.events.on("connected", () => {
          log(`[connected]connect to ${center_url}`);
        });
        await center_node.ready;
        return center_node;
      },
      {
        times: retry_times,
        delayMS: retry_interval,
        exceeded_error: new Error("center node not connected"),
      }
    );
    return center_node;
  }

  // 保证center node已连接并可用
  private async ensureCenterNode() {
    const current_peer_node = await this.center_node;
    if (current_peer_node?.is_alive) {
      return current_peer_node;
    }
    this.center_node = this.connectCenterNode();
    return this.center_node;
  }

  // 注册服务
  async register(
    service_name: string,
    service_fn: (...args: any[]) => any,
    options?: { overwrite?: boolean }
  ) {
    this.worker.method(
      service_name,
      async (params, peer_node) => {
        const result = await service_fn(...params);
        return result;
      },
      options
    );

    return (await this.ensureCenterNode()).request(
      CenterInternalService.service_login,
      [service_name]
    );
  }

  async callService<Result = any>(service_name: string, ...args: any[]) {
    return (await this.ensureCenterNode()).request<Result>(
      CenterInternalService.service_call,
      [{ service_name, args }]
    );
  }

  close() {
    this.worker.close();
    log(`worker close: ${this.worker.id}`);
  }
}
