import cliProgress from "cli-progress";
import { TqdmParams } from "./types";
import { range } from "./range";

function* generator(
  onNext: (value: any) => void,
  isDone: () => boolean
): Generator<any> {
  let value: any;
  while (!isDone()) {
    value = yield value;
    onNext(value);
  }
}

export class TqdmInstance {
  protected _generator: Generator<any>;
  protected _iterator: Iterator<any>;

  protected isDone = false;

  protected _progressBar = new cliProgress.SingleBar({
    // 类似 python tqdm 的format
    // 76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]
    format:
      "{desc}{percentage}%|{bar}|{value}/{total} [{x_duration_formatted}<{x_eta_formatted}, {iter_duration_formatted}]",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  protected barPayload = {
    x_duration_formatted: "00:00",
    iter_duration_formatted: "00:00",
    x_eta_formatted: "00:00",
    desc: "",
  };

  constructor(readonly params: TqdmParams) {
    this._generator = generator(this.onNext.bind(this), () => this.isDone);

    if (!params.iterable) {
      params.iterable = range(params.total ?? 100);
    }
    this._iterator = params.iterable[Symbol.iterator]();
    if (!params.total) {
      params.total = params.total ?? params.iterable.length ?? 100;
    }
    if (params.desc) {
      this.barPayload.desc = `${params.desc} `;
    }

    if (!params.disable) {
      this._progressBar.start(
        params.total!,
        params.initial ?? 0,
        this.barPayload
      );
    }

    this._progressBar.update(this.barPayload);
  }

  protected onDone() {
    this._progressBar.update(this.params.total!);
    this._progressBar.stop();
    this.isDone = true;
  }

  protected startTime = Date.now();
  protected times: number[] = [];
  protected iter_index = 0;

  protected barUpdate() {
    this.iter_index += 1;
    // 计算单次时间
    const time = Date.now();
    this.times.push(time);
    const duration = time - this.startTime;
    const iter_duration_ms = duration / this.times.length;

    // ms 格式化为 hh:mm:ss
    const msFormat = (ms: number) => {
      if (ms < 0) {
        return "00:00";
      }
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      // pad
      const pad = (x: number) =>
        Number.isFinite(x) ? x.toString().padStart(2, "0") : "00";
      if (h > 0) {
        return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
      }
      return `${pad(m % 60)}:${pad(s % 60)}`;
    };

    // 过了多久
    const duration_formatted = msFormat(duration);
    // 预计剩余时间
    const eta = iter_duration_ms * (this.params.total! - this.iter_index);
    const eta_formatted = msFormat(eta);
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

  protected onNext(next_value: any) {
    const { value, done } = this._iterator.next(next_value);
    this.barUpdate();

    if (done) {
      this.onDone();
    }
  }

  next(value?: any) {
    return this._generator.next(value);
  }

  *[Symbol.iterator]() {
    yield* this._generator;
  }
}
