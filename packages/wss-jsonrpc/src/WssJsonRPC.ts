import { IncomingMessage } from "http";
import WebSocket from "ws";

import { v4 as uuid } from "uuid";
import EventEmitter from "eventemitter3";

export namespace WssJsonRPC {
  export interface Request<Params = any[]> {
    jsonrpc: "2.0";
    id?: string;
    method: string;
    params?: Params;
  }

  export interface Response<Result = any> {
    jsonrpc: "2.0";
    id: string;
    result?: Result;
    // https://www.jsonrpc.org/specification

    // code	message	meaning
    // -32700	Parse error	Invalid JSON was received by the server.
    // An error occurred on the server while parsing the JSON text.
    // -32600	Invalid Request	The JSON sent is not a valid Request object.
    // -32601	Method not found	The method does not exist / is not available.
    // -32602	Invalid params	Invalid method parameter(s).
    // -32603	Internal error	Internal JSON-RPC error.
    // -32000 to -32099	Server error	Reserved for implementation-defined server-errors.
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  }

  export const jsonrpc = {
    request<Params = any[]>(method: string, params?: Params) {
      return {
        jsonrpc: "2.0",
        method,
        params,
      };
    },

    response<Result = any>(result?: Result) {
      return {
        jsonrpc: "2.0",
        result,
      };
    },

    error(message = "Internal error", code = -32603, data?: any) {
      return {
        jsonrpc: "2.0",
        error: {
          code,
          message,
          data,
        },
      };
    },
  };

  export class RPCNodeEvent<
    EventTypes extends EventEmitter.ValidEventTypes = {}
  > extends EventEmitter<
    {
      error: (err: any) => any;
      close: () => any;
      message: (data: WebSocket.RawData, node: PeerNode) => any;
      request: (data: Request, node: PeerNode) => any;
      response: (data: Response, node: PeerNode) => any;
    } & EventTypes
  > {}

  /**
   * NOTE: 这里是不管重试的，断线重试需要上级实现
   * NOTE: 这个对象不应该由用户创建，export 是为了类型安全需要
   */
  export class PeerNode {
    readonly events = new RPCNodeEvent<{
      connected: (node: PeerNode) => any;
      disconnected: (node: PeerNode) => any;
    }>();

    static timeouts = {
      connection_timeout: 30 * 1000, // 30s
      each_heartbeat: 10 * 1000, // 10s
      request_timeout: 5 * 60 * 1000, // 5min
    };

    readonly id = uuid();
    readonly ready: Promise<boolean>;

    private _is_alive = true;
    public get is_alive() {
      return this._is_alive;
    }
    private is_alive_timer = 0 as any;
    private heart_beat_timer = 0 as any;

    constructor(readonly socket: WebSocket) {
      const update_alive_timer = () => {
        clearTimeout(this.is_alive_timer);
        this.is_alive_timer = setTimeout(() => {
          this._is_alive = false;
          this.disconnect();
        }, PeerNode.timeouts.connection_timeout);
      };
      update_alive_timer();

      socket.on("message", (data) => this.events.emit("message", data, this));
      socket.on("error", (err) => this.events.emit("error", err));
      socket.on("close", () => {
        this.events.emit("close");
        this.disconnect();
      });
      socket.on("pong", () => {
        this._is_alive = true;
        update_alive_timer();
      });

      this.events.on("message", (data) => {
        this.onMessage(data);
      });

      if (socket.readyState === WebSocket.OPEN) {
        this.ready = Promise.resolve(true);
        this.events.emit("connected", this);
      } else {
        this.ready = new Promise((resolve, reject) => {
          socket.once("open", () => {
            resolve(true);
            this.events.emit("connected", this);
          });
          socket.once("error", (err) => reject(err));
        });
      }

      this.heart_beat_timer = setInterval(() => {
        socket.ping();
      }, PeerNode.timeouts.each_heartbeat);
    }

    private onMessage(data: any) {
      const parsedData: Request | Response = JSON.parse(
        Buffer.from(data).toString()
      );
      // TODO: 统一校验json rpc数据格式并拆封

      if (Array.isArray(parsedData)) {
        for (const item of parsedData) {
          this.onMessage(item);
        }
        return;
      }

      if ("method" in parsedData) {
        // on request
        this.events.emit("request", parsedData, this);
        return;
      }
      // on response
      this.events.emit("response", parsedData, this);

      // TODO 其他情况

      // // invalid message
      // // TODO custom Error object
      // this.events.emit("error", new Error("Invalid message"));
    }

    async request<Result = any, Params = any[]>(
      method: string,
      params?: Params
    ) {
      if (!this._is_alive) {
        throw new Error("PeerNode is disconnected");
      }
      await this.ready;
      const request: Request<Params> = {
        jsonrpc: "2.0",
        id: uuid(),
        method,
        params,
      };
      this.socket.send(JSON.stringify(request));
      return new Promise<Response<Result>>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("request timeout"));
        }, PeerNode.timeouts.request_timeout);
        this.events.on("response", (data) => {
          if (data.id !== request.id) {
            return;
          }
          resolve(data);
          clearTimeout(timer);
        });
        this.events.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
        this.events.on("disconnected", () => {
          clearTimeout(timer);
          reject(new Error("PeerNode is disconnected"));
        });
      });
    }

    async notify<Params = any[]>(method: string, params?: Params) {
      if (!this._is_alive) {
        throw new Error("PeerNode is disconnected");
      }
      const request: Request<Params> = {
        jsonrpc: "2.0",
        method,
        params,
      };
      await this.ready;
      this.socket.send(JSON.stringify(request));
    }

    async respond(response: Omit<Response, "jsonrpc">) {
      if (!this._is_alive) {
        throw new Error("PeerNode is disconnected");
      }
      await this.ready;
      this.socket.send(JSON.stringify({ jsonrpc: "2.0", ...response }));
    }

    disconnect() {
      this._is_alive = false;
      this.socket.close();
      this.socket.terminate();
      this.events.emit("disconnected", this);

      this.events.removeAllListeners();
      clearTimeout(this.is_alive_timer);
      clearInterval(this.heart_beat_timer);
    }
  }

  export class WorkerNode {
    readonly id = uuid();

    readonly events = new RPCNodeEvent<{
      connection: (socket: WebSocket, request: IncomingMessage) => any;
    }>();

    private server: WebSocket.Server | null = null;
    private peer_nodes = new Map<string, PeerNode>();

    private methods = new Map<string, (...params: any[]) => any>();

    constructor() {
      this.events.on("connection", (socket, request) => {
        this.onConnection(socket, request);
      });
      this.events.on("request", (data, node) => {
        this.onRequest(data, node);
      });
      this.events.on("response", (data, node) => {
        this.onResponse(data, node);
      });
    }

    private addPeerNode(peer_node: PeerNode) {
      this.peer_nodes.set(peer_node.id, peer_node);

      peer_node.events.on("request", (data, node) => {
        this.events.emit("request", data, node);
      });
      peer_node.events.on("response", (data, node) => {
        this.events.emit("response", data, node);
      });
      peer_node.events.on("error", (err) => {
        this.events.emit("error", err);
      });
      peer_node.events.on("disconnected", (node) => {
        this.removePeerNode(node.id);
      });

      return peer_node;
    }

    removePeerNode(id: string) {
      const node = this.peer_nodes.get(id);
      this.peer_nodes.delete(id);
      node?.events.removeAllListeners();
    }

    connect(address: string | URL) {
      const socket = new WebSocket(address);
      const peer_node = new PeerNode(socket);
      this.addPeerNode(peer_node);

      return peer_node;
    }

    listen(
      options?: WebSocket.ServerOptions<
        typeof WebSocket,
        typeof IncomingMessage
      >
    ) {
      if (this.server) {
        throw new Error("Already listening");
      }
      this.server = new WebSocket.Server(options);
      this.server.on("connection", (socket, request) => {
        this.events.emit("connection", socket, request);
      });
      this.server.on("close", () => this.events.emit("close"));
      return this.server;
    }

    private onConnection(socket: WebSocket, request: IncomingMessage) {
      const peer_node = new PeerNode(socket);
      this.addPeerNode(peer_node);
    }

    // register method
    method(
      name: string,
      callback: (params: any[], node: PeerNode) => any,
      {
        overwrite = false,
      }: {
        overwrite?: boolean;
      } = {
        overwrite: false,
      }
    ) {
      if (!overwrite && this.methods.has(name)) {
        throw new Error(`Method ${name} already exists`);
      }
      this.methods.set(name, callback);
    }

    subscribe: typeof this.method = this.method.bind(this);

    private async onRequest(request: Request, peer_node: PeerNode) {
      const { id, method, params = [] } = request;
      const callback = this.methods.get(method);
      if (!id) {
        // 没有id就是 Notification
        await callback?.(params, peer_node);
        return;
      }
      if (!callback) {
        await peer_node.respond({
          id,
          error: {
            code: -32601,
            message: `Method ${method} not found`,
          },
        });
        return;
      }
      try {
        const result = await callback(params, peer_node);
        if (result?.["jsonrpc"] === "2.0") {
          // 如果返回的是jsonrpc对象，就解构
          await peer_node.respond({
            ...result,
            id,
          });
        } else {
          await peer_node.respond({
            id,
            result,
          });
        }
      } catch (error) {
        if (!peer_node.is_alive) {
          return;
        }
        console.error(`Error in method [${method}]`, error);
        peer_node.respond({
          id,
          error: {
            code: -32000,
            message: "Internal error",
          },
        });
      }
    }

    allPeerNodes() {
      // NOTE: 不能用 [...this.peer_nodes.values()]
      return Array.from(this.peer_nodes.values());
    }

    // request all peer node
    request<Result = any, Params = any[]>(method: string, params?: Params) {
      return this.allPeerNodes().map((peer_node) =>
        peer_node.request<Result, Params>(method, params)
      );
    }

    // notify all peer node
    notify<Params = any[]>(method: string, params?: Params) {
      return this.allPeerNodes().map((peer_node) =>
        peer_node.notify<Params>(method, params)
      );
    }

    broadcast: typeof this.notify = this.notify.bind(this);

    onResponse(response: Response, peer_node: PeerNode) {
      // TODO 这里不知道需要干什么...
      // 因为调用都是用peer_node做的，所以这里好像什么也不用干
    }

    close() {
      this.server?.close();
      this.allPeerNodes().forEach((node) => {
        node.disconnect();
      });
      this.peer_nodes.clear();
    }
  }
}
