import { IDisposable } from "./types";

/**
 * Provides a convenient syntax that ensures the correct use of IDisposable objects
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
): Promise<[null, U] | [Error, undefined]>;
export function using<
  T extends IDisposable,
  T2 extends IDisposable,
  T3 extends IDisposable,
  T4 extends IDisposable,
  U
>(
  disposable: [T, T2, T3, T4],
  action: (r: T, r2: T2, r3: T3, r4: T4) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export function using<
  T extends IDisposable,
  T2 extends IDisposable,
  T3 extends IDisposable,
  U
>(
  disposable: [T, T2, T3],
  action: (r: T, r2: T2, r3: T3) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export function using<T extends IDisposable, T2 extends IDisposable, U>(
  disposable: [T, T2],
  action: (r: T, r2: T2) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export function using<T extends IDisposable, U>(
  disposable: [T],
  action: (r: T) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export function using<T extends IDisposable, U>(
  disposable: T,
  action: (r: T) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export function using<U>(
  disposable: IDisposable[],
  action: (...r: IDisposable[]) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;
export async function using(
  disposable: IDisposable | IDisposable[],
  action: (...r: IDisposable[]) => any
): Promise<[null, any] | [Error, undefined]> {
  let disposableArray = Array.isArray(disposable) ? disposable : [disposable];
  try {
    return [null, await action(...disposableArray)];
  } catch (error) {
    return [error, undefined];
  } finally {
    for (let d of disposableArray) {
      let result = d.dispose();
      if (result !== null) {
        await result;
      }
    }
  }
}

// examples

// class Dog implements IDisposable {
//   dispose(): void | Promise<void> {
//     console.log("dog dispose");
//   }
// }

// class Cat implements IDisposable {
//   dispose(): void | Promise<void> {
//     console.log("cat dispose");
//   }
// }

// (async () => {
//     let [error, r] = await using([new Dog(), new Cat()], (dog, cat) => {
//         console.log('using');
//         throw new Error('boom');
//     });
//     console.log(error);
//     [error, r] = await using([], () => {
//       console.log('using');
//       throw new Error('boom2');
//   });
//   console.log(error);
// })();
