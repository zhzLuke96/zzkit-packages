export type Context<C extends object> = {
  __break: boolean;
  break: () => void;
} & C;

export type PipeCaller<C extends object, T> = (
  value: T,
  ctx: Context<C>
) => Promise<T> | T;
export type PipeFreeCaller<C extends object, T> = (
  value: T,
  ctx?: Partial<Context<C>>
) => Promise<T> | T;

export function pipeWith<C extends object, T = any>(
  ctx: C,
  ...fns: PipeCaller<C, T>[]
): PipeFreeCaller<C, T> {
  return (initialValue, call_context) => {
    const context: Context<C> = {
      __break: false,
      break() {
        this.__break = true;
      },
      ...ctx,
      ...call_context,
    };
    return fns.reduce((promise, fn) => {
      return promise.then((value) => {
        if (context.__break) return value;
        return fn(value, context);
      });
    }, Promise.resolve(initialValue));
  };
}

export function pipe<C extends object, T = any>(...fns: PipeCaller<C, T>[]) {
  return pipeWith<Partial<C>, T>({}, ...fns);
}
