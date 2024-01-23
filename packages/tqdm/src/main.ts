export { TqdmInstance } from "./tqdm";
export { range } from "./range";

import { TqdmInstance } from "./tqdm";
import { TqdmParams } from "./types";

export function tqdm(
  iterable: Iterable<any>,
  params?: Omit<TqdmParams, "iterable">
): TqdmInstance {
  return new TqdmInstance({
    iterable,
    ...params,
  });
}
