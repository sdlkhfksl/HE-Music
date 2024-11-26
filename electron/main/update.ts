import { type BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
import log from "./logger";

// import
const { autoUpdater } = electronUpdater;

// 更新源
autoUpdater.setFeedURL({
  provider: "github",
  owner: "serious-snow",
  repo: "HE-Music",
});

// 禁用自动下载
autoUpdater.autoDownload = false;

// 是否初始化
let isInit: boolean = false;

// 是否提示
let isShowTip: boolean = false;

// 事件监听
const initUpdaterListeners = (win: BrowserWindow) => {
  if (isInit) return;

  // 当有新版本可用时
  autoUpdater.on("update-available", (info) => {
    win.webContents.send("update-available", info);
    log.info(`🚀 New version available: ${info.version}`);
  });

  // 更新下载进度
  autoUpdater.on("download-progress", (progress) => {
    win.webContents.send("download-progress", progress);
    log.info(`🚀 Downloading: ${progress.percent}%`);
  });

  // 当下载完成时
  autoUpdater.on("update-downloaded", (info) => {
    win.webContents.send("update-downloaded", info);
    log.info(`🚀 Update downloaded: ${info.version}`);
    // 安装更新
    autoUpdater.quitAndInstall();
  });

  // 当没有新版本时
  autoUpdater.on("update-not-available", (info) => {
    if (isShowTip) win.webContents.send("update-not-available", info);
    log.info(`✅ No new version available: ${info.version}`);
  });

  // 更新错误
  autoUpdater.on("error", (err) => {
    win.webContents.send("update-error", err);
    log.error(`❌ Update error: ${err.message}`);
  });

  isInit = true;
};

// 检查更新
export const checkUpdate = (win: BrowserWindow, showTip: boolean = false) => {
  // 初始化事件监听器
  initUpdaterListeners(win);
  // 更改提示
  isShowTip = showTip;
  // 检查更新
  autoUpdater.checkForUpdates();
};

// 开始下载
export const startDownloadUpdate = () => {
  autoUpdater.downloadUpdate();
};
