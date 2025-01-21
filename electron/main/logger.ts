// 日志输出
import { join } from "path";
import { app } from "electron";
import { isDev } from "./utils";
import log from "electron-log";

// 绑定事件
Object.assign(console, log.functions);

// 日志配置
log.transports.file.level = "info";
log.transports.file.maxSize = 2 * 1024 * 1024; // 2M
if (log.transports.ipc) log.transports.ipc.level = false;

// 控制台输出
log.transports.console.useStyles = true;

// 文件输出
log.transports.file.format = "{y}-{m}-{d} {h}:{i}:{s}:{ms} {text}";

// 本地输出
if (!isDev) {
  log.transports.file.resolvePathFn = () =>
    join(app.getPath("documents"), "/HE-Music/HE-Music-log.txt");
} else {
  log.transports.file.level = false;
}

log.info("📃 logger initialized");

export default log;
