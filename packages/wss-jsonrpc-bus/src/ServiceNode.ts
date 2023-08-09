import { WssJsonRPC } from "@zzkit/wss-jsonrpc";
import { CenterInternalService } from "./types";

export interface ServiceNodeOptions {
  center_url: string;
  retry_times?: number;
  retry_interval?: number;
}

export class ServiceNode {
  worker = new WssJsonRPC.WorkerNode();
  center_node?: Promise<WssJsonRPC.PeerNode>;

  constructor(readonly options: ServiceNodeOptions) {
    this.center_node = this.ensureCenterNode();
  }

  // 保证center node已连接并可用
  private async ensureCenterNode() {
    if ((await this.center_node)?.is_alive) {
      return (await this.center_node)!;
    }
    const { retry_interval = 1000, retry_times = 30 } = this.options;

    let count = 0;
    if (count >= retry_times) {
      throw new Error("center node not connected");
    }
    const { center_url } = this.options;
    let last_err = null as any;
    while (count < retry_times) {
      try {
        const center_node = this.worker.connect(center_url);
        center_node.events.on("connected", () => {
          console.log(`connected to ${center_url}`);
        });
        await center_node.ready;
        this.center_node = Promise.resolve(center_node);
        return center_node;
      } catch (error) {
        count += 1;
        last_err = error;
        await new Promise((resolve) => setTimeout(resolve, retry_interval));
      }
    }
    throw last_err || new Error("center node not connected");
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
