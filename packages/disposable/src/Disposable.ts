import { IDisposable } from "./types";

export const WHEN_DISPOSE_CALLBACK = Symbol("WHEN_DISPOSE_CALLBACK");
export const WHEN_DISPOSE = Symbol("WHEN_DISPOSE");
export const CALL_DISPOSE = Symbol("CALL_DISPOSE");

export const SIGNAL = Symbol("SIGNAL");
export const ABORT_CONTROLLER = Symbol("ABORT_CONTROLLER");

/**
 * Provides a mechanism for releasing resources.
 *
 * @example
 * ```ts
 * import { DisposableBase } from "@zzkit/disposable";
 *
 * class HelloDisposable extends DisposableBase {
 *   now = Date.now();
 *   constructor() {
 *     super();
 *     this[DisposableBase.WHEN_DISPOSE](() => {
 *       console.log("hello disposed...");
 *     });
 *   }
 * };
 * ```
 */
export class DisposableBase {
  static WHEN_DISPOSE_CALLBACK = WHEN_DISPOSE_CALLBACK;
  static WHEN_DISPOSE_SYMBOL = WHEN_DISPOSE;
  static CALL_DISPOSE = CALL_DISPOSE;

  static SIGNAL = SIGNAL;
  static ABORT_CONTROLLER = ABORT_CONTROLLER;

  [WHEN_DISPOSE_CALLBACK] = [] as (() => any)[];

  [ABORT_CONTROLLER] = new AbortController();

  get [SIGNAL]() {
    return this[ABORT_CONTROLLER].signal;
  }

  async [CALL_DISPOSE]() {
    if (typeof this[SIGNAL]?.throwIfAborted === "function") {
      this[SIGNAL].throwIfAborted();
    }
    if (typeof this[ABORT_CONTROLLER]?.abort === "function") {
      this[ABORT_CONTROLLER].abort();
    }

    return Promise.allSettled(this[WHEN_DISPOSE_CALLBACK].map((cb) => cb()));
  }

  /**
   * Registers a callback to be executed when the object is disposed.
   * @param callback - The function to be called when disposal occurs.
   * @param options - Optional configuration for the callback registration.
   * @param options.top - If true, the callback is added to the beginning of the callback list; otherwise, it is added to the end.
   */
  [WHEN_DISPOSE](
    callback: (...args: any[]) => any,
    options?: {
      top?: boolean;
    }
  ): void {
    if (this[SIGNAL].aborted) {
      callback();
    } else {
      if (options?.top) {
        this[WHEN_DISPOSE_CALLBACK].unshift(callback);
      } else {
        this[WHEN_DISPOSE_CALLBACK].push(callback);
      }
    }
  }
}

export type DisposableLike =
  | Function
  | IDisposable
  | {
      removeAllListeners: Function;
    }
  | {
      dispose: Function;
    }
  | {
      destroy: Function;
    }
  | {
      end: Function;
    };

export function connectAnyDisposable(
  source: IDisposable,
  target: DisposableLike
) {
  source[WHEN_DISPOSE](() => {
    const dispose =
      typeof target === "function"
        ? target
        : [
            CALL_DISPOSE,
            "removeAllListeners",
            "dispose",
            "destroy",
            "end",
          ].find((k) => target[k]);
    return typeof dispose === "function" ? dispose?.() : null;
  });
}

/**
 * Provides a mechanism for releasing resources.
 *
 * @implements {IDisposable}
 *
 * @example
 * ```ts
 * import { Disposable } from "@zzkit/disposable";
 *
 * class HelloDisposable extends Disposable {
 *   now = Date.now();
 *   constructor() {
 *     super();
 *     this.whenDispose(() => {
 *       console.log("hello disposed...");
 *     });
 *   }
 * };
 * ```
 */
export class Disposable extends DisposableBase implements IDisposable {
  disposed = this[SIGNAL];

  /**
   * Dispose the object and return a promise.
   *
   * @return {Promise<PromiseSettledResult<() => any>[]>} A promise that resolves with an array of settled promise results.
   */
  dispose = () => this[CALL_DISPOSE]();

  /**
   * Registers a callback to be executed when the object is disposed.
   * @param callback - The function to be called when disposal occurs.
   * @param options - Optional configuration for the callback registration.
   * @param options.top - If true, the callback is added to the beginning of the callback list; otherwise, it is added to the end.
   */
  onDisposed = (
    callback: (...args: any[]) => any,
    options?: {
      top?: boolean;
    }
  ) => this[WHEN_DISPOSE](callback, options);

  /**
   * Connects the object to another disposable object.
   * it like `Promise.prototype.then` method, but it is for `IDisposable` object.
   *
   * @param {IDisposable | Function} target - target object to connect to source (or callback function)
   * @return {void}
   */
  connect = (target: IDisposable | Function): void =>
    connectAnyDisposable(this, target);
}
