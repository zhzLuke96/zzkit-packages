import cliProgress from "cli-progress";
import { TqdmParams } from "./types";
import { range } from "./range";
import readline from "readline";

export class TqdmInstance<T = any> {
  /**
   * Formats a number of seconds as a clock time, [H:]MM:SS
   * @param ms Number of milliseconds
   * @returns Formatted clock time
   */
  static format_interval(ms: number) {
    if (ms < 0) {
      return "00:00";
    }
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const pad = (x: number) =>
      Number.isFinite(x) ? x.toString().padStart(2, "0") : "00";
    if (h > 0) {
      return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
    }
    return `${pad(m % 60)}:${pad(s % 60)}`;
  }

  protected isDone = false;

  protected _progressBar = new cliProgress.SingleBar({
    // default like python tqdm-style
    // 76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]
    format:
      "{desc}{percentage}%|{bar}|{value}/{total} [{x_duration_formatted}<{x_eta_formatted}, {iter_duration_formatted}]",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    // TODO: configure this
    // hideCursor: true,
  });

  protected barPayload = {
    x_duration_formatted: "00:00",
    iter_duration_formatted: "00:00",
    x_eta_formatted: "00:00",
    desc: "",
  };

  readonly params: TqdmParams &
    Required<Pick<TqdmParams, "total" | "iterable">>;

  /**
   * Creates a new instance of TqdmInstance with the given iterable and optional parameters.
   *
   * @param {TqdmParams} params - Optional parameters for the TqdmInstance.
   */
  constructor(params: TqdmParams) {
    this.params = params as any;
    const default_total = 100;
    if (!params.iterable) {
      params.iterable = range(params.total ?? default_total);
    }
    if (!params.total) {
      params.total = params.total ?? params.iterable.length ?? default_total;
    }
    if (params.desc) {
      this.barPayload.desc = `${params.desc} `;
    }

    if (!params.disable) {
      this._progressBar.start(
        params.total ?? default_total,
        params.initial ?? 0,
        this.barPayload
      );
    }

    this._progressBar.update(this.barPayload);

    // TODO: hide cursor and show cursor
    // process.on("exit", this.onProcessExit.bind(this));
    // process.on("SIGINT", this.onProcessExit.bind(this, true));
    // process.on("SIGUSR1", this.onProcessExit.bind(this, true));
    // process.on("SIGUSR2", this.onProcessExit.bind(this, true));
    // process.on("uncaughtException", this.onProcessExit.bind(this, true));
  }

  protected onProcessExit(self_exit = false) {
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.write("\u001B[?25h"); // show cursor

    if (!this.isDone) {
      this._progressBar.stop();
      this.isDone = true;
    }

    if (self_exit) {
      process.exit(1);
    }
  }

  protected onDone() {
    this._progressBar.update(this.params.total);
    this._progressBar.stop();
    this.isDone = true;
  }

  protected startTime = Date.now();
  protected times: number[] = [];
  protected iter_index = 0;

  /**
   * update to the next iter
   */
  public update(n: number) {
    if (this.isDone) return;
    this.iter_index = n;
    this.flush();
  }

  /**
   * Resets to 0 iterations for repeated use.
   */
  public reset(total = -1) {
    this.iter_index = 0;
    this.startTime = Date.now();
    this.times = [];
    if (total > 0) {
      this.params.total = total;
    }
    this._progressBar.setTotal(this.params.total);
    this._progressBar.update(this.iter_index, this.barPayload);
  }

  public flush() {
    // 计算单次时间
    const time = Date.now();
    this.times.push(time);
    const duration = time - this.startTime;
    const iter_duration_ms = duration / this.times.length;

    // 过了多久
    const duration_formatted = TqdmInstance.format_interval(duration);
    // 预计剩余时间
    const eta = iter_duration_ms * (this.params.total - this.iter_index);
    const eta_formatted = TqdmInstance.format_interval(eta);
    // 单次时间 it/s 或者 s/it 如果一个iter大于1s 则显示 it/s
    const iter_duration_formatted =
      iter_duration_ms < 1000
        ? // 如果小于 1s 就显示每秒多少次
          `${(1000 / iter_duration_ms).toFixed(2)}it/s`
        : `${(iter_duration_ms / 1000).toFixed(2)}s/it`;

    this._progressBar.update(this.iter_index, {
      x_duration_formatted: duration_formatted,
      iter_duration_formatted,
      x_eta_formatted: eta_formatted,
    });
  }

  *[Symbol.iterator]() {
    const iterator = this.params.iterable[Symbol.iterator]();
    for (const value of iterator) {
      yield value as T;
      this.iter_index += 1;
      this.flush();
    }
    this.onDone();
  }
}
