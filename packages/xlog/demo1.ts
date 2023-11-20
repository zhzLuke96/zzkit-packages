import { Logger, formatters, transports, filters, LogLevels } from "./src/main";
import fs from "fs";

const filename_fn =
  (level: string, ext = ".log") =>
  (date: Date) =>
    `logs/${level}-${date.toISOString().slice(0, 10)}${ext}`;
const filename_to_date_fn = (starts_with: string) => (filename: string) => {
  if (!filename.startsWith(starts_with)) {
    return null;
  }
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) {
    return null;
  }
  return new Date(m[1]);
};

const loggerInstance = new Logger({
  // because we are using `transports.console`, we should set `hidden_orig_console` to `true`
  hidden_orig_console: true,
  transports: [
    new transports.console({
      formatter: formatters.transport.line1_colorize,
    }),
    new transports.dailyFile({
      max_days: 7,
      filename: filename_fn("info"),
      filename_to_date: filename_to_date_fn("info"),
      formatter: formatters.transport.apache,
      filter: filters.not_level(LogLevels.error),
      save_freq_ms: 10 * 1000,
    }),
    new transports.dailyFile({
      max_days: 7,
      filename: filename_fn("error"),
      filename_to_date: filename_to_date_fn("error"),
      formatter: formatters.transport.apache,
      filter: filters.level(LogLevels.error),
      save_freq_ms: 1 * 1000,
    }),
    new transports.dailyFile({
      max_days: 1,
      filename: filename_fn("full", ".jsonl"),
      filename_to_date: filename_to_date_fn("full"),
      formatter: formatters.transport.json,
      save_freq_ms: 10 * 1000,
    }),
  ],
  formatters: [
    formatters.log.label({
      pid: process.pid,
    }),
    // you should replace `TOP_SECRET` to api-key or password
    formatters.log.secret("TOP_SECRET"),
  ],
});

(async () => {
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }

  console.log("hello world");
  console.info("hello world");
  console.warn("hello world");
  console.error("hello world");
  console.debug("hello world");

  console.log(
    "now, let's try some secret stuff: TOP_SECRET!!! and i will say 'TOP_SECRET' again, TOP_SECRET!!!"
  );
})();
