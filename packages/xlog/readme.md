# @zzkit/xlog

here is an invasive logging library that hooks into the global console object to enable logging with different transports and formatting.

## Installation

```
npm install @zzkit/xlog
```

## Usage

To start logging, instantiate the Logger class with configuration options:

```js
import { Logger, transports, filters, formatters } from '@zzkit/xlog';

const logger = new Logger({
  transports: [
    new transports.console(),
    new transports.dailyFile({
      filename: (date) => `./logs/log-${date.toISOString().split('T')[0]}.log` 
    })
  ],
  formatters: [formatters.simple],  
});
```

This will log to the console and daily log files.

Then you can use the regular `console` methods for logging:

```js
console.log('Hello world!'); 

console.debug('Debug message');
```

### Configuration

The `Logger` constructor takes a configuration object with the following properties:

- `transports` - Array of `Transport` instances for handling logs
- `formatters` - Array of `LogFormatter` functions for transforming log data
- `hidden_orig_console` - Whether to suppress logs from the original console (default false) 

### Built-in Transports

- `transports.console` - Logs to console 
- `transports.file` - Logs to a file
- `transports.dailyFile` - Logs to daily file, removes old files

### Built-in Formatters

- `formatters.log.label` - Adds label data to log
- `formatters.log.secret` - Hidden secret pattern in message

### Built-in Transport Formatters 

- `formatters.transport.line1_colorize` - Colorized single line log
- `formatters.transport.line1` - Single line log 
- `formatters.transport.apache` - Apache common log format
- `formatters.transport.json` - JSON format
- `formatters.transport.json_no_stack` - JSON without stack trace

### Filters

You can filter logs by log level:

```js
import { filters } from '@zzkit/xlog';

// Only log warnings and errors
const logger = new Logger({
  transports: [
    new transports.console({
      filter: filters.not_level(LogLevels.info) 
    })
  ]  
});
```

## Full usage

see file [./demo1.ts](./demo1.ts).

## License

MIT