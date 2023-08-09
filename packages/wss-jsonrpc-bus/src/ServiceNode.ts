import { WssJsonRPC } from "@zzkit/wss-jsonrpc";
import { CenterInternalService } from "./types";

async function retry<T>(
  fn: () => Promise<T>,
  options: {
    times: number;
    delayMS: number;
    exceeded_error?: Error;
  }
) {
  const { times, delayMS, exceeded_error } = options;

  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, delayMS));
    }
  }

  throw exceeded_error || new Error("Exceeded retry times");
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

  private async connectCenterNode() {
    const {
      retry_interval = 1000,
      retry_times = 30,
      center_url,
    } = this.options;

    const center_node = await retry(
      async () => {
        const center_node = this.worker.connect(center_url);
        center_node.events.on("connected", () => {
          console.log(`connected to ${center_url}`);
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
    let center_node = await this.center_node;
    if (!center_node?.is_alive) {
      center_node = await this.connectCenterNode();
      this.center_node = Promise.resolve(center_node);
    }
    return center_node;
  }

  // 注册服务
  async register(service_name: string, service_fn: (...args: any[]) => any) {
    this.worker.method(service_name, async (params, peer_node) => {
      const result = await service_fn(...params);
      return result;
    });

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
  }
}
