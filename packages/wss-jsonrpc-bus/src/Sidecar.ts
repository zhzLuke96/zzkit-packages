import { ServiceNode, ServiceNodeOptions } from "./ServiceNode";
import debug from "debug";
import EventEmitter from "eventemitter3";
import { Disposable } from "@zzkit/disposable";

const log = debug("wss-jsonrpc-bus:sidecar");

const url_join = (base_url: string, path: string) =>
  new URL(path, base_url).href;

/**
 * 定义一种第三方服务，sidecar将根据定义的方式调用第三方服务
 *
 * 同时根据配置将服务注册到中心服务中
 */

export class Sidecar extends Disposable {
  events = new EventEmitter<{
    start: () => void;
    stop: () => void;
    restart: () => void;
    disconnect: () => void;
  }>();

  serviceNode: ServiceNode;

  constructor(
    readonly serviceName: string,
    serviceNodeOptions: ServiceNodeOptions
  ) {
    super();

    this.whenDispose(() => {
      this.stop();
      this.serviceNode.dispose();
      this.events.removeAllListeners();
    });

    this.serviceNode = new ServiceNode(serviceNodeOptions);
  }

  async endpoint(...args: any[]): Promise<any> {
    return null;
  }

  // start service
  async start() {
    await this.reconnect();
    await this.serviceNode.register(
      this.serviceName,
      async (...params) => {
        // 确保连通
        await this.ensureServiceAvailable();
        // TODO timeout check
        return this.endpoint(...params);
      },
      {
        // 覆盖注册
        overwrite: true,
      }
    );
    this.events.emit("start");
  }

  async restart() {
    log(`[restart] ${this.serviceNode.worker.id}`);
    await this.disconnect();
    await this.start();

    this.events.emit("restart");
  }

  async stop() {
    log(`[stop] ${this.serviceNode.worker.id}`);
    this.serviceNode.close();

    this.events.emit("stop");
  }

  protected async healthCheck() {
    return true;
  }

  // 主动断开连接 (比如health check失败)
  protected async disconnect() {
    log(`[disconnect] ${this.serviceNode.worker.id}`);
    const center_node = await this.serviceNode.center_node;
    center_node?.disconnect();

    this.events.emit("disconnect");
  }

  protected async ensureServiceAvailable() {
    const is_health = await this.healthCheck();
    if (is_health) {
      return;
    }
    await this.restart();
  }

  private async healthCheckAndRetry(retry_times = 30, retry_interval = 1000) {
    for (let i = 0; i < retry_times; i++) {
      try {
        if (await this.healthCheck()) {
          return true;
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("fetch is not defined")
        ) {
          throw error;
        }
        log(`health check failed, retry ${i} times, error: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, retry_interval));
    }
    return false;
  }

  private reconnect_promise?: Promise<any>;

  // 确保一次就一个reconnect
  protected async reconnect(retry_times = 30, retry_interval = 1000) {
    if (!this.reconnect_promise) {
      this.reconnect_promise = this._reconnect(retry_times, retry_interval);
      await this.reconnect_promise;
      this.reconnect_promise = undefined;
    }
    await this.reconnect_promise;
  }

  // 主动连接 (比如health check成功)
  protected async _reconnect(retry_times = 30, retry_interval = 1000) {
    log(`[reconnect:start] ${this.serviceNode.worker.id}`);
    // 检查连通性
    if (!(await this.healthCheckAndRetry(retry_times, retry_interval))) {
      throw new Error("health check failed");
    }
    log(`[reconnect:health_check_ok] ${this.serviceNode.worker.id}`);
    // 连接中心服务
    this.serviceNode.center_node = this.serviceNode.connectCenterNode();
    await this.serviceNode.center_node;
    log(`[reconnect:center_node_ok] ${this.serviceNode.worker.id}`);
  }
}

export interface HttpEndpointOptions {
  base_url: string;
  service_path: string;
  method: string;
  headers?: Record<string, string>;
}

export class HttpSidecar extends Sidecar {
  constructor(
    serviceName: string,
    serviceNodeOptions: ServiceNodeOptions,
    readonly endpointOptions: HttpEndpointOptions
  ) {
    super(serviceName, serviceNodeOptions);
  }

  get url() {
    const { base_url, service_path } = this.endpointOptions;
    return url_join(base_url, service_path);
  }

  // 只处理第一个参数body
  async endpoint(body: any): Promise<any> {
    const { method, headers } = this.endpointOptions;
    const { url } = this;

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch (error) {
      log("error", error);
      return {
        __raw_text__: rawText,
      };
    }
  }

  get ping_url() {
    const { base_url } = this.endpointOptions;
    return url_join(base_url, "ping");
  }

  // 每次请求之前会调用这个方法判断服务器是否可用
  protected async healthCheck() {
    // 请求 ping 接口
    return fetch(this.ping_url)
      .then((res) => {
        if (res.status >= 200 && res.status < 300) {
          return true;
        } else {
          return false;
        }
      })
      .catch((err) => {
        return false;
      });
  }
}

export class JsonrpcSidecar extends Sidecar {
  // TODO
}

export class GrpcSidecar extends Sidecar {
  // TODO
}

export class ThriftSidecar extends Sidecar {
  // TODO
}

export class WebSocketSidecar extends Sidecar {
  // TODO
}
