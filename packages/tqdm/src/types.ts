/**
 * TODO:
 *
 * 1. 一些params用不到/还没实现 需要清理
 * 2. 现在只实现了 desc total iterable disable
 */

//
export type TqdmParams = {
  /**
   * Iterable to decorate with a progressbar. Leave blank to manually manage the updates.
   */
  iterable?: any;
  /**
   * Prefix for the progressbar.
   */
  desc?: string;
  /**
   * The number of expected iterations. If unspecified, len(iterable) is used if possible. If float("inf") or as a last resort, only basic progress statistics are displayed (no ETA, no progressbar). If gui is True and this parameter needs subsequent updating, specify an initial arbitrary large positive number, e.g. 9e9.
   */
  total?: number;
  /**
   * If [default: True], keeps all traces of the progressbar upon termination of iteration. If None, will leave only if position is 0.
   */
  leave?: boolean;
  /**
   * Specifies where to output the progress messages (default: sys.stderr). Uses file.write(str) and file.flush() methods. For encoding, see write_bytes.
   */
  file?: any;
  /**
   * The width of the entire output message. If specified, dynamically resizes the progressbar to stay within this bound. If unspecified, attempts to use environment width. The fallback is a meter width of 10 and no limit for the counter and statistics. If 0, will not print any meter (only stats).
   */
  ncols?: number;
  /**
   * Minimum progress display update interval [default: 0.1] seconds.
   */
  mininterval?: number;
  /**
   * Maximum progress display update interval [default: 10] seconds. Automatically adjusts miniters to correspond to mininterval after long display update lag. Only works if dynamic_miniters or monitor thread is enabled.
   */
  maxinterval?: number;
  /**
   * Minimum progress display update interval, in iterations. If 0 and dynamic_miniters, will automatically adjust to equal mininterval (more CPU efficient, good for tight loops). If > 0, will skip display of specified number of iterations. Tweak this and mininterval to get very efficient loops. If your progress is erratic with both fast and slow iterations (network, skipping items, etc) you should set miniters=1.
   */
  miniters?: number;
  /**
   * If unspecified or False, use unicode (smooth blocks) to fill the meter. The fallback is to use ASCII characters " 123456789#".
   */
  ascii?: boolean | string;
  /**
   * Whether to disable the entire progressbar wrapper [default: False]. If set to None, disable on non-TTY.
   */
  disable?: boolean;
  /**
   * String that will be used to define the unit of each iteration [default: it].
   */
  unit?: string;
  /**
   * If 1 or True, the number of iterations will be reduced/scaled automatically and a metric prefix following the International System of Units standard will be added (kilo, mega, etc.) [default: False]. If any other non-zero number, will scale total and n.
   */
  unit_scale?: boolean | number;
  /**
   * If set, constantly alters ncols and nrows to the environment (allowing for window resizes) [default: False].
   */
  dynamic_ncols?: boolean;
  /**
   * Exponential moving average smoothing factor for speed estimates (ignored in GUI mode). Ranges from 0 (average speed) to 1 (current/instantaneous speed) [default: 0.3].
   */
  smoothing?: number;
  /**
   * Specify a custom bar string formatting. May impact performance. [default: '{l_bar}{bar}{r_bar}'], where l_bar='{desc}: {percentage:3.0f}%|' and r_bar='| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, ' '{rate_fmt}{postfix}]' Possible vars: l_bar, bar, r_bar, n, n_fmt, total, total_fmt, percentage, elapsed, elapsed_s, ncols, nrows, desc, unit, rate, rate_fmt, rate_noinv, rate_noinv_fmt, rate_inv, rate_inv_fmt, postfix, unit_divisor, remaining, remaining_s, eta. Note that a trailing ": " is automatically removed after {desc} if the latter is empty.
   */
  bar_format?: string;
  /**
   * The initial counter value. Useful when restarting a progress bar [default: 0]. If using float, consider specifying {n:.3f} or similar in bar_format, or specifying unit_scale.
   */
  initial?: number;
  /**
   * Specify the line offset to print this bar (starting from 0) Automatic if unspecified. Useful to manage multiple bars at once (eg, from threads).
   */
  position?: number;
  /**
   * Specify additional stats to display at the end of the bar. Calls set_postfix(**postfix) if possible (dict).
   */
  postfix?: any;
  /**
   * [default: 1000], ignored unless unit_scale is True.
   */
  unit_divisor?: number;
  /**
   * Whether to write bytes. If (default: False) will write unicode.
   */
  write_bytes?: boolean;
  /**
   * Passed to refresh for intermediate output (initialisation, iterating, and updating).
   */
  lock_args?: any[];
  /**
   * The screen height. If specified, hides nested bars outside this bound. If unspecified, attempts to use environment height. The fallback is 20.
   */
  nrows?: number;
  /**
   * Bar colour (e.g. 'green', '00ff00').
   */
  colour?: string;
  /**
   * Don't display until [default: 0] seconds have elapsed.
   */
  delay?: number;
};
