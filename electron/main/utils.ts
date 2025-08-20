import { app } from "electron";
import { is } from "@electron-toolkit/utils";
import fs from "fs/promises";
import crypto from "crypto";
import { resolve } from "path";
import { File, MediaTypes } from "node-taglib-sharp";

// 系统判断
export const isDev = is.dev;
export const isWin = process.platform === "win32";
export const isMac = process.platform === "darwin";
export const isLinux = process.platform === "linux";

// 程序名称
export const appName = app.getName() || "HE-Music";

// 生成唯一ID
export const getFileID = (filePath: string): number => {
  // SHA-256
  const hash = crypto.createHash("sha256");
  hash.update(filePath);
  const digest = hash.digest("hex");
  // 将哈希值的前 16 位转换为十进制数字
  const uniqueId = parseInt(digest.substring(0, 16), 16);
  return Number(uniqueId.toString().padStart(16, "0"));
};

// 生成文件 MD5
export const getFileMD5 = async (path: string): Promise<string> => {
  const data = await fs.readFile(path);
  const hash = crypto.createHash("md5");
  hash.update(data);
  return hash.digest("hex");
};

export const parseFile = (path: string) => {
  let songFile: File | null = null;
  try {
    const filePath = resolve(path).replace(/\\/g, "/");
    songFile = File.createFromPath(filePath);
    const { tag, properties } = songFile;
    const codecs = properties.codecs;
    return {
      title: tag.title || "",
      artists: tag.albumArtists.slice() || [],
      album: tag.album || "",
      alia: tag.comment || "",
      // subtitle: tag.subtitle || "",
      duration: Number(properties.durationMilliseconds.toFixed(0)) / 1000 || 0,
      channels: properties.audioChannels,
      codec: codecs?.[0]?.description,
      lossless: codecs?.[0]?.mediaTypes === MediaTypes.LosslessAudio,
      bitsPerSample: properties.bitsPerSample || 16,
      sampleRate: properties.audioSampleRate,
      bitrate: properties.audioBitrate,
      lyrics: tag.lyrics || "",
      pictures: tag.pictures.slice(),
    };
  } finally {
    songFile?.dispose();
  }
};
