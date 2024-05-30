import { IDisposable } from "./types";
import { usingWith } from "./usingWith";

/**
 * Executes the given `action` using the provided `disposable` objects.
 *
 * NOTE: `usingE(...)` like `using(...)` but not catch error, just throw
 *
 * @param {Array<IDisposable>} disposable - The array of disposable objects to be used.
 * @param {Function} action - The function to be executed using the disposable objects.
 * @returns {Promise<U>} A promise that resolves to either an array containing a null value and the result of the action, or an array containing an Error object and undefined.
 *
 * @example
 * ```ts
 * import { usingE, Disposable } from "@zzkit/disposable";
 *
 * const some_disposable = new Disposable();
 * some_disposable.whenDispose(() => console.log("disposed..."));
 *
 * const result = await usingE(some_disposable, (o1) => {
 *   console.log("inner scope...");
 * });
 * ```
 */
export function using<
  T extends IDisposable,
  T2 extends IDisposable,
  T3 extends IDisposable,
  T4 extends IDisposable,
  T5 extends IDisposable,
  U
>(
  disposable: [T, T2, T3, T4, T5],
  action: (r: T, r2: T2, r3: T3, r4: T4, r5: T5) => U | Promise<U>
): Promise<U>;
export function using<
  T extends IDisposable,
  T2 extends IDisposable,
  T3 extends IDisposable,
  T4 extends IDisposable,
  U
>(
  disposable: [T, T2, T3, T4],
  action: (r: T, r2: T2, r3: T3, r4: T4) => U | Promise<U>
): Promise<U>;
export function using<
  T extends IDisposable,
  T2 extends IDisposable,
  T3 extends IDisposable,
  U
>(
  disposable: [T, T2, T3],
  action: (r: T, r2: T2, r3: T3) => U | Promise<U>
): Promise<U>;
export function using<T extends IDisposable, T2 extends IDisposable, U>(
  disposable: [T, T2],
  action: (r: T, r2: T2) => U | Promise<U>
): Promise<U>;
export function using<T extends IDisposable, U>(
  disposable: [T],
  action: (r: T) => U | Promise<U>
): Promise<U>;
export function using<T extends IDisposable, U>(
  disposable: T,
  action: (r: T) => U | Promise<U>
): Promise<U>;
export function using<U>(
  disposable: IDisposable[],
  action: (...r: IDisposable[]) => U | Promise<U>
): Promise<U>;
export async function using(
  disposable: IDisposable | IDisposable[],
  action: (...r: IDisposable[]) => any
): Promise<any> {
  const [err, result] = await usingWith(disposable as any, action);
  if (err) {
    throw err;
  }
  return result;
}
