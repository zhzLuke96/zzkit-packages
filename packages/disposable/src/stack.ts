import { Disposable } from "./Disposable";

export class DispositionStack extends Disposable {
  defer(
    callback: () => any,
    options?: {
      top?: boolean;
    }
  ) {
    this.onDisposed(callback, options);
  }
}
