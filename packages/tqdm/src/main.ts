export { TqdmInstance } from "./tqdm";
export { range } from "./range";

import { TqdmInstance } from "./tqdm";
import { TqdmParams } from "./types";

/**
 * Creates a new instance of TqdmInstance with the given iterable and optional parameters.
 *
 * @param {Iterable<Item>} iterable - The iterable to be iterated over.
 * @param {Omit<TqdmParams, "iterable">} [params] - Optional parameters for the TqdmInstance.
 * @return {TqdmInstance<Item>} - A new instance of TqdmInstance.
 */
export function tqdm<Item = any>(
  iterable: Iterable<Item>,
  params?: Omit<TqdmParams, "iterable">
): TqdmInstance<Item> {
  return new TqdmInstance<Item>({
    iterable,
    ...params,
  });
}
