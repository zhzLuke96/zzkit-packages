import { IncomingMessage } from "http";
import { WssJsonRPC } from "@zzkit/wss-jsonrpc";
import WebSocket from "ws";
import { CenterInternalService } from "./types";

export class CenterServer {
  worker = new WssJsonRPC.WorkerNode();

  // 服务名和对应的提供服务的节点
  services = {} as Record<string, Set<WssJsonRPC.PeerNode>>;
  // 不同peer node对应的job请求数
  job_counter = new WeakMap<WssJsonRPC.PeerNode, number>();

  constructor() {
    this.worker.method(
      CenterInternalService.service_login,
      ([service_name], node) => {
        // TODO 参数校验
        this.loginService(service_name, node);
      }
    );
    this.worker.method(
      CenterInternalService.service_call,
      async ([{ service_name, args }], node) => {
        // TODO 参数校验

        try {
          const result = await this.callService(service_name, ...args);
          return result;
        } catch (error) {
          return WssJsonRPC.jsonrpc.error();
        }
      }
    );
  }

  listen(
    server_options?: WebSocket.ServerOptions<
      typeof WebSocket,
      typeof IncomingMessage
    >
  ) {
    return this.worker.listen(server_options);
  }

  // 登记服务
  loginService(service_name: string, peer_node: WssJsonRPC.PeerNode) {
    this.services[service_name] ||= new Set();
    this.services[service_name].add(peer_node);
    this.job_counter.set(peer_node, 0);

    peer_node.events.on("disconnected", () => {
      this.services[service_name].delete(peer_node);
    });
  }

  private async getServiceNodes(service_name: string, retry_times = 15) {
    // 如果没有节点就重试
    let count = 0;
    while (count < retry_times) {
      // NOTE: 不能用 [...xxx.values()] 打包会有问题
      const nodes = Array.from(
        this.services[service_name]?.values() || []
      ).filter((x) => x.is_alive);
      if (nodes.length === 0) {
        count += 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      return nodes;
    }
    return [];
  }

  // 获取可用的服务节点 并用随机策略负载均衡
  private async getServiceNode(service_name: string) {
    const services = await this.getServiceNodes(service_name);
    if (services.length === 0) {
      return null;
    }
    // 区分有任务和无任务节点，优先返回无任务节点
    const job0_nodes = services.filter((node) => {
      return (this.job_counter.get(node) ?? 0) <= 0;
    });
    if (job0_nodes.length !== 0) {
      return job0_nodes[Math.floor(Math.random() * job0_nodes.length)];
    }
    const job1_nodes = services.filter((node) => {
      return (this.job_counter.get(node) ?? 0) > 0;
    });
    return job1_nodes[Math.floor(Math.random() * job1_nodes.length)];
  }

  // 调用服务
  async callService(service_name: string, ...args: any[]) {
    let retry_times = 5;
    while (retry_times) {
      const service_node = await this.getServiceNode(service_name);
      if (!service_node) {
        throw new Error(`service ${service_name} not found`);
      }
      try {
        this.job_counter.set(
          service_node,
          (this.job_counter.get(service_node) ?? 0) + 1
        );
        const result = await service_node.request(service_name, args);
        return result;
      } catch (err) {
        // TODO inner Error class
        if (err instanceof Error && err.message.includes("disconnected")) {
          retry_times -= 1;
          continue;
        }
        throw err;
      } finally {
        this.job_counter.set(
          service_node,
          Math.max(0, (this.job_counter.get(service_node) ?? 0) - 1)
        );
      }
    }
  }

  close() {
    this.worker.close();
  }
}
