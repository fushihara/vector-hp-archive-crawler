import { ensureDir } from "jsr:@std/fs@0.224.0";
import { format } from "jsr:@std/datetime@0.224.0/format";
import { sprintf } from "jsr:@std/fmt@0.225.1/printf";
import {
  ConsoleHandler,
  FormatterFunction,
  getLevelByName,
  getLogger as _getLogger,
  type LogConfig,
  LogLevels,
  RotatingFileHandler,
  setup,
} from "jsr:@std/log@0.224.9";
const formatter: FormatterFunction = (event) => {
  const messages = [
    event.msg,
    ...event.args.map((data) => {
      if (data instanceof Error) {
        return data.stack!;
      } else if (typeof data == "object") {
        return JSON.stringify(data);
      } else {
        return String(data);
      }
    }),
  ].join(" ");
  return sprintf(
    "[%s][%-8s][%-10s]%s",
    format(event.datetime, "yyyy/MM/dd HH:mm:ss.SSS"),
    event.levelName,
    event.loggerName,
    messages,
  );
};
const setupParam: LogConfig = {
  handlers: {
    console: new ConsoleHandler("DEBUG", {
      formatter: formatter,
      useColors: true,
    }),
    file: new RotatingFileHandler("DEBUG", {
      bufferSize: 100,
      maxBytes: 10 * 1000 * 1000,
      maxBackupCount: 10,
      filename: "./.logs/system.txt",
      formatter: formatter,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console", "file"],
    },
  },
} as const;
const defaultHandlers = setupParam.loggers!.default.handlers?.map((handlerName) => {
  const v = setupParam.handlers?.[handlerName] ?? null;
  return v;
}).filter((h) => h != null) ?? [];
export function getLogger(name?: string) {
  const gotLogger = _getLogger(name);
  if (gotLogger.handlers.length == 0) {
    gotLogger.handlers = [...defaultHandlers];
  }
  const defualtLevel = setupParam.loggers?.default?.level;
  if (defualtLevel) {
    gotLogger.level = getLevelByName(defualtLevel);
  } else {
    gotLogger.level = LogLevels.INFO;
  }
  return gotLogger;
}
await ensureDir("./.logs");
setup(setupParam);
const loggerDeno = getLogger();
loggerDeno.info("アプリケーション起動");