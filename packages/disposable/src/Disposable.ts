import { IDisposable } from "./types";

export const DISPOSE_CALLBACKS_SYMBOL = Symbol("DISPOSE_CALLBACKS");
export const DISPOSE_CALLER_SYMBOL = Symbol("DISPOSE_CALLER");
export const WHEN_DISPOSE_SYMBOL = Symbol("WHEN_DISPOSE");

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
 *     this[DisposableBase.WHEN_DISPOSE_SYMBOL](() => {
 *       console.log("hello disposed...");
 *     });
 *   }
 * };
 * ```
 */
export class DisposableBase {
  static DISPOSE_CALLBACKS_SYMBOL = DISPOSE_CALLBACKS_SYMBOL;
  static DISPOSE_CALLER_SYMBOL = DISPOSE_CALLER_SYMBOL;
  static WHEN_DISPOSE_SYMBOL = WHEN_DISPOSE_SYMBOL;

  [DISPOSE_CALLBACKS_SYMBOL] = [] as any[];

  /**
   * Dispose the object and return a promise.
   *
   * @return {Promise<PromiseSettledResult<any>[]>} A promise that resolves with an array of settled promise results.
   */
  [DISPOSE_CALLER_SYMBOL]() {
    // NOTE: this type is safe
    return new Promise<PromiseSettledResult<any>[]>((resolve, reject) => {
      Promise.allSettled(
        this[DISPOSE_CALLBACKS_SYMBOL].map(async (callback) => callback())
      )
        .then(resolve)
        .catch(reject);
      this[DISPOSE_CALLBACKS_SYMBOL] = [];
    });
  }

  /**
   * Executes a callback function when the object is disposed.
   * If the options parameter is provided with the top property set to true,
   * the callback will be added to the beginning of the list of dispose callbacks.
   * Otherwise, it will be added to the end of the list.
   *
   * @param callback - The callback function to execute when the object is disposed.
   * @param {{ top?: boolean }} [options] - The options for the dispose callback.
   * @param {boolean} [options.top] - If true, the callback will be added to the beginning of the list of dispose callbacks.
   * @return {void}
   */
  [WHEN_DISPOSE_SYMBOL](
    callback: (...args: any[]) => any,
    options?: {
      top?: boolean;
    }
  ) {
    if (options?.top) {
      this[DISPOSE_CALLBACKS_SYMBOL].unshift(callback);
    } else {
      this[DISPOSE_CALLBACKS_SYMBOL].push(callback);
    }
  }
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
  [DISPOSE_CALLBACKS_SYMBOL] = [] as any[];

  /**
   * Dispose the object and return a promise.
   *
   * @return {Promise<PromiseSettledResult<any>[]>} A promise that resolves with an array of settled promise results.
   */
  dispose(): any {
    return this[DISPOSE_CALLER_SYMBOL]();
  }

  /**
   * Executes a callback function when the object is disposed.
   * If the options parameter is provided with the top property set to true,
   * the callback will be added to the beginning of the list of dispose callbacks.
   * Otherwise, it will be added to the end of the list.
   *
   * @param callback - The callback function to execute when the object is disposed.
   * @param {{ top?: boolean }} [options] - The options for the dispose callback.
   * @param {boolean} [options.top] - If true, the callback will be added to the beginning of the list of dispose callbacks.
   * @return {void}
   */
  whenDispose(
    callback: (...args: any[]) => any,
    options?: {
      top?: boolean;
    }
  ) {
    this[WHEN_DISPOSE_SYMBOL](callback, options);
  }
}
