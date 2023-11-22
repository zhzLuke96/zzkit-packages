import fs from "fs";
import path from "path";

type StackItem = {
  func: string;
  file: string;
  line: number;
  column: number;
};

function parseStack(stack: string[]) {
  return stack
    .map((item) => {
      const matches = item.trim().match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (matches) {
        const [, func, file, line, column] = matches;
        return {
          func,
          file,
          line: Number(line),
          column: Number(column),
        };
      }
      return null;
    })
    .filter(Boolean) as StackItem[];
}

export enum LogLevels {
  log = "log",
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error",
}
export const logLevels = [
  LogLevels.log,
  LogLevels.debug,
  LogLevels.info,
  LogLevels.warn,
  LogLevels.error,
];

export type LogData = {
  level: LogLevels;
  msg: string;
  stack: StackItem[];
  timestamp: number;
  [key: string]: any;
};

export interface Transport {
  log(data: LogData): void;
}
export interface LogFormatter {
  (data: LogData): LogData;
}
export interface TransportFormatter {
  (data: LogData): string;
}

export class Logger {
  static readonly origConsole = { ...console } as typeof console;
  static defaultMessageFormatter(...args: any[]) {
    return args
      .map((item) => {
        if (typeof item === "string" || item instanceof String) {
          return item;
        }
        return JSON.stringify(item);
      })
      .join(" ");
  }

  constructor(
    readonly config: {
      transports: Transport[];
      formatters: LogFormatter[];
      hidden_orig_console?: boolean;
      message_formatter?: (...args: any[]) => string;
    }
  ) {
    this.hookConsole();
  }

  hookConsole() {
    const { origConsole } = Logger;
    logLevels.forEach((level) => {
      console[level] = (...args: any[]) => {
        const stack = parseStack(new Error().stack?.split("\n").slice(2) || []);

        const msg = (
          this.config.message_formatter || Logger.defaultMessageFormatter
        )(...args);
        this.log(level, msg, stack);
        if (this.config.hidden_orig_console) {
          return;
        }
        origConsole[level](...args);
      };
    });
  }

  log(level: LogLevels, msg: string, stack: StackItem[]) {
    const { transports, formatters } = this.config;
    const formatted = formatters.reduce((acc, formatter) => formatter(acc), {
      level,
      msg,
      stack,
      timestamp: Date.now(),
    } as LogData);
    transports.forEach((transport) => transport.log(formatted));
  }
}

class FileTransport implements Transport {
  constructor(
    readonly config: {
      filename: string;
      filter?: (data: LogData) => boolean;
      formatter?: (data: LogData) => string;
      save_freq_ms?: number;
    }
  ) {}

  protected buffer = [] as LogData[];
  protected flush_timer: any = null;

  log(data: LogData): void {
    if (this.config.filter && !this.config.filter(data)) {
      return;
    }

    this.buffer.push(data);
    if (!this.flush_timer) {
      this.flush_timer = setTimeout(() => {
        this.flush();
        this.clear();
        this.flush_timer = null;
      }, this.config.save_freq_ms ?? 1000);
    }
  }

  protected clear() {
    this.buffer = [];
  }

  protected flush(): void {
    const formatter = this.config.formatter ?? ((data) => JSON.stringify(data));
    this.appendLogToFile(this.buffer.map(formatter).join("\n"));
  }

  // 获取现在的文件名
  protected filename() {
    return this.config.filename;
  }

  protected appendLogToFile(log: string) {
    const filename = this.filename();
    if (!fs.existsSync(filename)) {
      fs.writeFileSync(filename, "");
    }
    fs.appendFileSync(filename, log + "\n");
  }
}

class ConsoleTransport implements Transport {
  constructor(
    readonly config?: {
      filter?: (data: LogData) => boolean;
      formatter?: (data: LogData) => string;
    }
  ) {}

  log(data: LogData): void {
    if (this.config?.filter && !this.config?.filter(data)) {
      return;
    }
    const formatter =
      this.config?.formatter ?? ((data) => JSON.stringify(data));

    Logger.origConsole.log(formatter(data));
  }
}

// 根据日期切割日志
class DailyFileTransport extends FileTransport {
  constructor(
    readonly daily_config: {
      filename: (date: Date) => string;
      filename_to_date: (filename: string) => Date | null;

      // 保存多少天的日志
      max_days?: number;

      filter?: (data: LogData) => boolean;
      formatter?: (data: LogData) => string;
      save_freq_ms?: number;
    }
  ) {
    super({ ...daily_config } as any);
  }

  protected filename(): string {
    return this.daily_config.filename(new Date());
  }

  protected flush(): void {
    super.flush();
    this.removeOldFiles();
  }

  protected removeOldFiles() {
    const { filename_to_date, max_days } = this.daily_config;
    if (!max_days) {
      return;
    }

    const now = new Date();
    const { dir } = path.parse(this.filename());
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const date = filename_to_date(file);
      if (!date) {
        return;
      }
      const msN = max_days * 24 * 60 * 60 * 1000;
      if (now.getTime() - date.getTime() > msN) {
        const filepath = path.join(dir, file);
        fs.unlinkSync(filepath);
      }
    });
  }
}

export const transports = {
  file: FileTransport,
  console: ConsoleTransport,
  dailyFile: DailyFileTransport,
} as const;

export const filters = {
  level: (level: LogLevels) => (data: LogData) => data.level === level,
  not_level: (level: LogLevels) => (data: LogData) => data.level !== level,
} as const;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

export const log_formatters = {
  secret: (match: string | RegExp) => (data: LogData) => {
    const msg = data.msg;
    if (typeof match === "string") {
      data.msg = replaceAll(msg, match, "*".repeat(match.length));
    } else {
      data.msg = msg.replace(match, (match) => "*".repeat(match.length));
    }
    return data;
  },
  label: (label_data: object) => (data: LogData) => {
    return {
      ...label_data,
      ...data,
    };
  },
} as const;

const level2color = {
  // blue
  [LogLevels.debug]: `\x1b[34m`,
  // green
  [LogLevels.info]: `\x1b[32m`,
  // yellow
  [LogLevels.warn]: `\x1b[33m`,
  // red
  [LogLevels.error]: `\x1b[31m`,
  // white
  [LogLevels.log]: `\x1b[37m`,
};

const stackUsefulFilter = (data: LogData) =>
  data.stack.filter(
    (x) => !x.file.startsWith("node:") && !x.file.includes("node_modules")
  );
const timeStr = (data: LogData) =>
  new Date(data.timestamp).toLocaleDateString() +
  " " +
  new Date(data.timestamp).toLocaleTimeString();

export const transport_formatters = {
  line1_colorize: (data: LogData) => {
    const time = timeStr(data);
    const stack0 = stackUsefulFilter(data)[0];
    const color = level2color[data.level];
    if (!stack0) {
      return `[${time}] ${color}[${data.level}]\x1b[0m ${data.msg}`.trim();
    }
    return `[${time}] ${color}[${data.level}]\x1b[0m [${stack0.file}:${stack0.line}:${stack0.column}] ${data.msg}`.trim();
  },
  line1: (data: LogData) => {
    const time = timeStr(data);
    const stack0 = stackUsefulFilter(data)[0];
    if (!stack0) {
      return `[${time}] [${data.level}] ${data.msg}`.trim();
    }
    return `[${time}] [${data.level}] [${stack0.file}:${stack0.line}:${stack0.column}] ${data.msg}`.trim();
  },
  apache: (data: LogData) => {
    const time = timeStr(data);
    const stack0 = stackUsefulFilter(data)[0];
    if (!stack0) {
      return `[${time}] [${data.level}] ${data.msg}`.trim() + "\n";
    }
    return (
      `[${time}] [${data.level}] [${stack0.file}:${stack0.line}:${stack0.column}]\n${data.msg}`.trim() +
      "\n"
    );
  },
  json: (data: LogData) =>
    JSON.stringify({
      ...data,
      stack: stackUsefulFilter(data),
    }),
  json_no_stack: (data: LogData) =>
    JSON.stringify({ ...data, stack: undefined }),
} as const;

export const formatters = {
  log: log_formatters,
  transport: transport_formatters,
};
