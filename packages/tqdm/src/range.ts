export function range(stop: number): Iterable<number> & { length: number };
export function range(
  start: number,
  stop?: number,
  step?: number
): Iterable<number> & { length: number };
export function range(
  start: number,
  stop?: number,
  step: number = 1
): Iterable<number> & { length: number } {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  const length = Math.ceil((stop - start) / step);
  return {
    length,
    [Symbol.iterator]: function* () {
      for (let i = start; i < stop!; i += step!) {
        yield i;
      }
    },
  };
}
