/**
 * Generates a sequence of numbers within a specified range.
 *
 * @param {number} start - The starting number of the range.
 * @param {number} [stop] - The ending number of the range. If not provided, the range will be from 0 to `start`.
 * @param {number} [step=1] - The increment value between each number in the range.
 * @returns {Iterable<number> & { length: number }} - An iterable object that generates the sequence of numbers within the range.
 */
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
