import { Logger, formatters, transports, filters, LogLevels } from "./src/main";
import fs from "fs";

const filenameFn =
  (level: string, ext = ".log") =>
  (date: Date) =>
    `logs/${level}-${date.toISOString().slice(0, 10)}${ext}`;
const filenameToDateFn = (filename: string) => {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) {
    return null;
  }
  return new Date(m[1]);
};

const loggerInstance = new Logger({
  hidden_orig_console: true,
  transports: [
    new transports.console({
      formatter: formatters.transport.line1_colorize,
    }),
    new transports.dailyFile({
      maxFiles_day: 7,
      filename: filenameFn("info"),
      filename_to_date: filenameToDateFn,
      formatter: formatters.transport.apache,
      filter: filters.not_level(LogLevels.error),
      save_freq_ms: 10 * 1000,
    }),
    new transports.dailyFile({
      maxFiles_day: 7,
      filename: filenameFn("error"),
      filename_to_date: filenameToDateFn,
      formatter: formatters.transport.apache,
      filter: filters.level(LogLevels.error),
      save_freq_ms: 1 * 1000,
    }),
    new transports.dailyFile({
      maxFiles_day: 1,
      filename: filenameFn("full", ".jsonl"),
      filename_to_date: filenameToDateFn,
      formatter: formatters.transport.json,
      save_freq_ms: 10 * 1000,
    }),
  ],
  formatters: [
    formatters.log.label({
      pid: process.pid,
    }),
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
