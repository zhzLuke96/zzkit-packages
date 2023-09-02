import { IncomingMessage } from "http";
import { WssJsonRPC } from "@zzkit/wss-jsonrpc";
import WebSocket from "ws";
import { CenterInternalService } from "./types";
import EventEmitter from "eventemitter3";

import { Disposable } from "@zzkit/disposable";

export class CenterServer extends Disposable {
  events = new EventEmitter<{
    call: (
      service_name: string,
      args: any[],
      peer_node: WssJsonRPC.PeerNode
    ) => void;
    login: (service_name: string, peer_node: WssJsonRPC.PeerNode) => void;
    logout: (service_name: string, peer_node: WssJsonRPC.PeerNode) => void;
    disconnect: (service_name: string, peer_node: WssJsonRPC.PeerNode) => void;
    close: () => void;
  }>();

  worker = new WssJsonRPC.WorkerNode();

  // 服务名和对应的提供服务的节点
  services = {} as Record<string, Set<WssJsonRPC.PeerNode>>;
  // 不同peer node对应的job请求数
  job_counter = new WeakMap<WssJsonRPC.PeerNode, number>();

  constructor() {
    super();

    this.whenDispose(() => {
      this.close();
      this.worker.dispose();
      for (const services of Object.values(this.services)) {
        for (const node of services) {
          node.dispose();
        }
      }
      this.services = {};
      this.events.removeAllListeners();
    });

    this.worker.method(
      CenterInternalService.service_login,
      ([service_name], node) => {
        // TODO 参数校验
        this.loginService(service_name, node);
      }
    );
    // 其实peer node断开之后就会自动删除service，不过增加一个接口主动调用
    this.worker.method(
      CenterInternalService.service_logout,
      ([service_name], node) => {
        // TODO 参数校验
        this.logoutService(service_name, node);
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
    this.events.emit("login", service_name, peer_node);

    peer_node.events.on("disconnected", () => {
      this.logoutService(service_name, peer_node);
      this.events.emit("disconnect", service_name, peer_node);
    });
  }

  // 退订服务
  logoutService(service_name: string, peer_node: WssJsonRPC.PeerNode) {
    if (peer_node.is_alive) {
      peer_node.disconnect();
    }
    this.services[service_name]?.delete(peer_node);
    this.job_counter.delete(peer_node);
    this.events.emit("logout", service_name, peer_node);
  }

  private async getServiceNodes(service_name: string, retry_times = 15) {
    // 如果没有节点就重试
    let retry_count = 0;
    while (retry_count < retry_times) {
      // NOTE: 不能用 [...xxx.values()] 打包会有问题
      const nodes = Array.from(
        this.services[service_name]?.values() || []
      ).filter((x) => x.is_alive);
      if (nodes.length === 0) {
        retry_count += 1;
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
    let retry_times = 30;
    while (retry_times) {
      const service_node = await this.getServiceNode(service_name);
      if (!service_node) {
        retry_times -= 1;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      // babel编译bug...这里必须再判断一次
      if (!service_node) {
        continue;
      }
      this.job_counter.set(
        service_node,
        (this.job_counter.get(service_node) ?? 0) + 1
      );
      this.events.emit("call", service_name, args, service_node);
      try {
        const result = await service_node.request(service_name, args);
        return result;
      } catch (err) {
        // TODO inner Error class
        if (err instanceof Error && err.message.includes("disconnected")) {
          retry_times -= 1;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        } else {
          // NOTE: 这里必须else里面，不然...编译出错...
          console.log(
            err instanceof Error,
            err.message,
            err.message.includes("disconnected")
          );
          throw err;
        }
      } finally {
        this.job_counter.set(
          service_node,
          Math.max(0, (this.job_counter.get(service_node) ?? 0) - 1)
        );
      }
    }
    throw new Error(`service ${service_name} not found`);
  }

  close() {
    for (const services of Object.values(this.services)) {
      for (const node of services) {
        node.disconnect();
      }
    }
    this.worker.close();
    this.events.emit("close");
  }
}
