import { IDisposable } from "./types";

export class Disposable implements IDisposable {
  private _dispose_callbacks = [] as any[];

  dispose(): any {
    // NOTE: type safe
    return new Promise<PromiseSettledResult<any>[]>((resolve, reject) => {
      Promise.allSettled(
        this._dispose_callbacks.map(async (callback) => callback())
      )
        .then(resolve)
        .catch(reject);
      this._dispose_callbacks = [];
    });
  }

  whenDispose(
    callback: (...args: any[]) => any,
    options?: {
      top?: boolean;
    }
  ) {
    if (options?.top) {
      this._dispose_callbacks.unshift(callback);
    } else {
      this._dispose_callbacks.push(callback);
    }
  }
}
