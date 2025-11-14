import type { PlayModeType } from "@/types/main";
import { Howl, Howler } from "howler";
import { cloneDeep } from "lodash-es";
import { useDataStore, useMusicStore, useSettingStore, useStatusStore } from "@/stores";
import { parsedLyricsData, parseLocalLyric, resetSongLyric, calculateLyricIndex } from "./lyric";
import { songLyric } from "@/api/song";
import { calculateProgress } from "./time";
import { isDev, isElectron } from "./env";
import blob from "./blob";
import { Link, SongInfo } from "@/types/main.hemusic";
import { AxiosError } from "axios";
import { t } from "@/i18n";
import { listRadioSongs } from "@/api/radio";
import { shuffleArray, runIdle } from "./helper";
import {
  getCoverColor,
  getPlayerInfo,
  getPlaySongData,
  getOnlineUrl,
  getUnlockSongUrl,
} from "@/utils/player/song";
import audioContextManager from "@/utils/player/context";

// 播放器核心
// Howler.js

// 允许播放格式
const allowPlayFormat = ["mp3", "aac", "m4a", "ogg", "flac", "ape", "wav"];

class Player {
  // 播放器
  private player: Howl;
  // 定时器
  private playerInterval: ReturnType<typeof setInterval> | undefined;
  /** 自动关闭定时器 */
  private autoCloseInterval: ReturnType<typeof setInterval> | undefined;
  // 频谱数据
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  /** 并发控制：当前播放会话与初始化/切曲状态 */
  private playSessionId: number = 0;
  /** 是否正在切换歌曲 */
  private switching: boolean = false;
  /** 当前曲目重试信息（按歌曲维度计数） */
  private retryInfo: { songId: string; count: number } = { songId: "", count: 0 };

  constructor() {
    // 创建播放器实例
    this.player = new Howl({ src: [""], format: allowPlayFormat, autoplay: false });
    // 初始化媒体会话
    this.initMediaSession();
    // 挂载全局
    window.$player = this;
  }

  /**
   * 新建会话并返回会话 id
   */
  private newSession(): number {
    this.playSessionId += 1;
    return this.playSessionId;
  }

  /**
   * 检查传入会话是否过期
   */
  private isStale(sessionId: number): boolean {
    return sessionId !== this.playSessionId;
  }

  /**
   * 重置底层播放器与定时器（幂等）
   */
  private resetPlayerCore() {
    try {
      // 仅卸载当前播放器实例
      if (this.player) {
        this.player.stop();
        this.player.off();
        this.player.unload();
      }
    } catch {
      /* empty */
    }
    this.cleanupAllTimers();
  }
  /**
   * 重置状态
   */
  resetStatus() {
    const statusStore = useStatusStore();
    const musicStore = useMusicStore();
    // 重置状态
    statusStore.$patch({
      currentTime: 0,
      duration: 0,
      progress: 0,
      currentTimeOffset: 0,
      lyricIndex: -1,
      playStatus: false,
      playLoading: false,
    });
    musicStore.$patch({
      playSong: {},
      playPlaylist: {},
    });
  }

  /**
   * 处理播放状态
   */
  private handlePlayStatus() {
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();
    const currentSessionId = this.playSessionId;
    // 清理定时器
    clearInterval(this.playerInterval);
    // 更新播放状态
    this.playerInterval = setInterval(() => {
      // 检查会话是否过期
      if (currentSessionId !== this.playSessionId) {
        clearInterval(this.playerInterval);
        return;
      }
      if (!this.player.playing()) return;
      const currentTime = this.getSeek();
      const duration = this.player.duration();
      // 计算进度条距离
      const progress = calculateProgress(currentTime, duration);
      // 计算歌词索引（支持 LRC 与逐字 YRC，对唱重叠处理）
      const lyricIndex = calculateLyricIndex(currentTime);
      // 更新状态
      statusStore.$patch({
        currentTime,
        duration,
        progress,
        lyricIndex,
      });
      // 客户端事件
      if (isElectron) {
        // 歌词变化
        window.electron.ipcRenderer.send(
          "play-lyric-change",
          cloneDeep({
            lyricIndex,
            currentTime,
            songId: musicStore.playSong?.id,
            songOffset: statusStore.getSongOffset(musicStore.playSong),
          }),
        );
        // 进度条
        if (settingStore.showTaskbarProgress) {
          window.electron.ipcRenderer.send("set-bar", progress);
        }
      }
    }, 250);
  }

  /**
   * 创建播放器
   * @param src 播放地址
   * @param autoPlay 是否自动播放
   * @param seek 播放位置
   */
  private async createPlayer(src: string, autoPlay: boolean = true, seek: number = 0) {
    // 获取数据
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();
    // 播放信息
    const { id, platform, path } = musicStore.playSong;
    const currentSessionId = this.playSessionId;
    // 检查会话是否过期
    if (currentSessionId !== this.playSessionId) {
      console.log("🚫 Session expired, skipping player creation");
      return;
    }
    // 清理播放器
    Howler.unload();
    // 创建播放器
    this.player = new Howl({
      src,
      format: allowPlayFormat,
      html5: true,
      autoplay: false,
      preload: "metadata",
      pool: 1,
      volume: statusStore.playVolume,
      rate: statusStore.playRate,
    });

    // 播放器事件
    this.playerEvent({ seek });
    // 播放设备
    if (!settingStore.showSpectrums) this.toggleOutputDevice();
    // 自动播放
    if (autoPlay) await this.play();
    // 获取歌词数据 - 非电台和本地
    if (!path) this.getLyricData(id, platform);
    else resetSongLyric();
    // 定时获取状态
    if (!this.playerInterval) this.handlePlayStatus();
    // 新增播放历史
    dataStore.setHistory(musicStore.playSong);
    // 获取歌曲封面主色
    if (!path) runIdle(() => getCoverColor(musicStore.songCover));
    // 更新 MediaSession
    if (!path) this.updateMediaSession();
    // 开发模式
    if (isDev) window.player = this.player;
  }

  /**
   * 播放器事件
   */
  private playerEvent(
    options: {
      // 恢复进度
      seek?: number;
    } = { seek: 0 },
  ) {
    // 获取数据
    const dataStore = useDataStore();
    const statusStore = useStatusStore();
    const playSongData = getPlaySongData();
    // 获取配置
    const { seek } = options;
    const currentSessionId = this.playSessionId;
    // 初次加载
    this.player.once("load", () => {
      if (currentSessionId !== this.playSessionId) return;
      // // 允许跨域
      // const audioDom = this.getAudioDom();
      // audioDom.crossOrigin = "anonymous";
      // 恢复均衡器：如持久化为开启，则在音频节点可用后立即构建 EQ 链
      if (isElectron && statusStore.eqEnabled) {
        try {
          this.enableEq({ bands: statusStore.eqBands });
        } catch {
          /* empty */
        }
      }
      // 恢复进度（ 需距离本曲结束大于 2 秒 ）
      // 恢复进度（仅在明确指定且大于0时才恢复，避免切换歌曲时意外恢复进度）
      if (seek && seek > 0) {
        const duration = this.player.duration();
        // 确保恢复的进度有效且距离歌曲结束大于2秒
        if (duration && seek < duration - 2) {
          this.setSeek(seek);
        }
      }
      // 更新状态
      statusStore.playLoading = false;

      // 重置当前曲目重试计数
      try {
        const current = getPlaySongData();
        this.retryInfo = { songId: `${current?.id}-${current?.platform}`, count: 0 };
      } catch {
        /* empty */
      }
      // ipc
      if (isElectron) {
        window.electron.ipcRenderer.send("play-song-change", getPlayerInfo());
        window.electron.ipcRenderer.send(
          "like-status-change",
          dataStore.isLikeSong(playSongData || { id: "", platform: "" }),
        );
      }
    });
    // 播放
    this.player.on("play", () => {
      if (currentSessionId !== this.playSessionId) return;
      window.document.title = getPlayerInfo() || "HE-Music";

      // 重置当前曲目重试计数
      try {
        const current = getPlaySongData();
        this.retryInfo = { songId: `${current?.id}-${current?.platform}`, count: 0 };
      } catch {
        /* empty */
      }
      // ipc
      if (isElectron) {
        window.electron.ipcRenderer.send("play-status-change", true);
        window.electron.ipcRenderer.send("play-song-change", getPlayerInfo());
      }
      console.log("▶️ song play:", playSongData);
    });
    // 暂停
    this.player.on("pause", () => {
      if (currentSessionId !== this.playSessionId) return;
      if (!isElectron) window.document.title = "HE-Music";
      // ipc
      if (isElectron) window.electron.ipcRenderer.send("play-status-change", false);
      console.log("⏸️ song pause:", playSongData);
    });
    // 结束
    this.player.on("end", () => {
      if (currentSessionId !== this.playSessionId) return;
      // statusStore.playStatus = false;
      console.log("⏹️ song end:", playSongData);

      // 检查是否需要在歌曲结束时执行自动关闭
      const statusStore = useStatusStore();
      if (
        statusStore.autoClose.enable &&
        statusStore.autoClose.waitSongEnd &&
        statusStore.autoClose.remainTime <= 0
      ) {
        // 执行自动关闭
        this.executeAutoClose();
        return;
      }
      this.nextOrPrev("next");
    });
    // 错误
    // 错误
    this.player.on("loaderror", (sourceid, err: unknown) => {
      if (currentSessionId !== this.playSessionId) return;
      const code = typeof err === "number" ? err : undefined;
      this.handlePlaybackError(code);
      console.error("❌ song load error:", sourceid, playSongData, err);
    });
    this.player.on("playerror", (sourceid, err: unknown) => {
      if (currentSessionId !== this.playSessionId) return;
      const code = typeof err === "number" ? err : undefined;
      this.handlePlaybackError(code);
      console.error("❌ song play error:", sourceid, playSongData, err);
    });
  }

  /**
   * 初始化 MediaSession
   */
  private initMediaSession() {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", () => this.play());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => this.nextOrPrev("prev"));
    navigator.mediaSession.setActionHandler("nexttrack", () => this.nextOrPrev("next"));
    // 跳转进度
    navigator.mediaSession.setActionHandler("seekto", (event) => {
      if (event.seekTime) this.setSeek(event.seekTime);
    });
  }

  /**
   * 更新 MediaSession
   */
  private updateMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const musicStore = useMusicStore();
    const settingStore = useSettingStore();
    // 获取播放数据
    const playSongData = getPlaySongData();
    if (!playSongData) return;
    // 播放状态
    // 获取数据
    const metaData: MediaMetadataInit = {
      title: playSongData.name,
      artist: Array.isArray(playSongData.artists)
        ? playSongData.artists.map((item) => item.name).join(" / ")
        : String(playSongData.artists),
      album:
        typeof playSongData.album === "object"
          ? playSongData.album.name
          : String(playSongData.album),
      artwork: settingStore.smtcOutputHighQualityCover
        ? [
            {
              src: musicStore.getSongCover(1000),
              sizes: "1000x1000",
              type: "image/jpeg",
            },
            {
              src: musicStore.getSongCover(700),
              sizes: "700x700",
              type: "image/jpeg",
            },
            {
              src: musicStore.getSongCover(500),
              sizes: "500x500",
              type: "image/jpeg",
            },
          ]
        : [
            {
              src: musicStore.getSongCover(500),
              sizes: "500x500",
              type: "image/jpeg",
            },
            {
              src: musicStore.getSongCover(150),
              sizes: "150x150",
              type: "image/jpeg",
            },
            {
              src: musicStore.getSongCover(300),
              sizes: "300x300",
              type: "image/jpeg",
            },
          ],
    };
    // 更新数据
    navigator.mediaSession.metadata = new window.MediaMetadata(metaData);
  }

  // 生成频谱数据
  private generateSpectrumData() {
    const statusStore = useStatusStore();
    if (!this.analyser || !this.dataArray) {
      this.initSpectrumData();
    }
    // 更新频谱数据
    const updateSpectrumData = () => {
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        // 保存数据
        statusStore.spectrumsData = Array.from(this.dataArray);
      }
      requestAnimationFrame(updateSpectrumData);
    };
    updateSpectrumData();
  }

  /**
   * 集中处理播放错误与重试策略
   */
  private async handlePlaybackError(errCode?: number) {
    const dataStore = useDataStore();
    const playSongData = getPlaySongData();
    const statusStore = useStatusStore();
    const currentSongId = `${playSongData?.id}@${playSongData?.platform}`;
    // 初始化/切换曲目时重置计数
    if (!this.retryInfo.songId || this.retryInfo.songId !== currentSongId) {
      this.retryInfo = { songId: currentSongId, count: 0 };
    }
    this.retryInfo.count += 1;
    // 错误码 2：资源过期或临时网络错误，允许较少次数的刷新
    if (errCode === 2 && this.retryInfo.count <= 2) {
      await this.initPlayer(true, this.getSeek());
      return;
    }
    // 其它错误：最多 3 次
    if (this.retryInfo.count <= 3) {
      await this.initPlayer(true, 0);
      return;
    }

    if (this.retryInfo.count >= 5) {
      this.retryInfo = { songId: currentSongId, count: 0 };
      this.resetStatus();
      window.$message.error(t("message.retry_too_many_times"));
      return;
    }

    // 超过次数：切到下一首或清空
    this.retryInfo.count = 0;
    if (dataStore.playList.length > 1 || statusStore.radioMode) {
      window.$message.error("当前歌曲播放失败，已跳至下一首");
      await this.nextOrPrev("next");
    } else {
      window.$message.error(t("message.no_playable_song"));
      // this.cleanPlayList();
    }
  }

  /**
   * 获取歌词
   * @param id 歌曲id
   * @param platform
   */
  private async getLyricData(id: string, platform: string) {
    if (!id) {
      resetSongLyric();
      return;
    }
    const lyricRes = await songLyric(id, platform);
    parsedLyricsData(lyricRes);
  }

  /**
   * 获取 Audio Dom
   */
  private getAudioDom(): HTMLMediaElement | null {
    try {
      const sounds = (this.player as any)?._sounds;
      const node = sounds && sounds.length ? sounds[0]?._node : null;
      return node || null;
    } catch {
      return null;
    }
  }

  /**
   * 获取本地歌曲元信息
   * @param path 歌曲路径
   */
  private async parseLocalMusicInfo(path: string) {
    try {
      const musicStore = useMusicStore();
      // 获取封面数据
      const coverData = await window.electron.ipcRenderer.invoke("get-music-cover", path);
      if (coverData) {
        const { data, format } = coverData;
        const blobURL = blob.createBlobURL(data, format, path);
        if (blobURL) {
          musicStore.playSong.cover = blobURL;
        }
      } else {
        musicStore.playSong.cover = "/images/song.jpg?assest";
      }
      // 获取主色
      runIdle(() => getCoverColor(musicStore.playSong.cover));
      // 获取歌词数据
      const lrcData = await window.electron.ipcRenderer.invoke("get-music-lyric", path);
      parseLocalLyric(lrcData);
      // 更新媒体会话
      this.updateMediaSession();
    } catch (error) {
      window.$message.error(t("message.get_local_music_meta_fail"));
      console.error("Failed to parse local music info:", error);
    }
  }

  /**
   * 初始化播放器
   * 核心外部调用
   * @param autoPlay 是否自动播放
   * @param seek 播放位置
   * @param quality 播放音质
   */
  async initPlayer(autoPlay: boolean = true, seek: number = 0, quality: string = "") {
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();
    const sessionId = this.newSession();
    try {
      // 获取播放数据
      const playSongData = getPlaySongData();
      if (!playSongData) {
        statusStore.playLoading = false;
        return;
      }
      const { id, platform, path } = playSongData;
      // 更改当前播放歌曲
      musicStore.playSong = playSongData;
      // 更改状态
      statusStore.playLoading = true;

      // 清理旧播放器与计时器
      this.resetPlayerCore();

      // 本地歌曲
      if (path) {
        if (this.isStale(sessionId)) return;
        try {
          statusStore.playQuality = playSongData.quality || "SD";
          await this.createPlayer(`file://${path}`, autoPlay, seek);
          await this.parseLocalMusicInfo(path);
        } catch (err) {
          console.error("播放器初始化错误（本地）：", err);
        }
      }
      // 在线歌曲
      else if (id && platform) {
        const link = this.selectPlayQuality(playSongData, quality);
        if (!link) throw new Error("Get song link error");
        statusStore.playQuality = link.name;
        console.log("Getting online song url...", id, platform, link);
        const songId = id;
        if (!songId) throw new Error("Get song id error");

        let url: string | null = null;
        try {
          url = await getOnlineUrl(songId, platform, link);
        } catch (error) {
          console.log("Getting online song url error:", error);
          // 如果是 AxiosError 的 401 就忽略
          if (error instanceof AxiosError && error.response?.status === 401) {
            return;
          }
        }
        // 正常播放地址
        if (url) {
          statusStore.playUblock = false;
          await this.createPlayer(url, autoPlay, seek);
          if (quality) {
            window.$message.success(t("message.change_quality_to", { quality }));
          }
        }
        // 尝试解灰
        else if (isElectron && settingStore.useSongUnlock) {
          const unlockUrl = await getUnlockSongUrl(playSongData);
          if (unlockUrl) {
            statusStore.playUblock = true;
            console.log("🎼 Song unlock successfully:", unlockUrl);
            await this.createPlayer(unlockUrl, autoPlay, seek);
          } else {
            statusStore.playUblock = false;
            // 是否为最后一首
            if (statusStore.playIndex === dataStore.playList.length - 1) {
              statusStore.$patch({ playStatus: false, playLoading: false });
              window.$message.warning(t("message.no_playable_song_tip"));
            } else {
              window.$message.error(t("message.no_song_link"));
              this.switching = false;
              this.nextOrPrev("next");
            }
          }
        } else {
          if (dataStore.playList.length === 1) {
            this.resetStatus();
            window.$message.warning(t("message.no_playable_song_tip"));
            return;
          } else {
            window.$message.error(t("message.song_play_fail"));
            this.switching = false;
            await this.nextOrPrev("next");
            return;
          }
        }
      }
    } catch (error) {
      console.error("❌ 初始化音乐播放器出错：", error);
      window.$message.error(t("message.player_error"));
      this.switching = false;
      await this.nextOrPrev("next");
    }
  }

  /**
   * 播放
   */
  async play() {
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();

    // 检查播放器状态
    if (!this.player || this.player.state() === "unloaded") {
      window.$message.warning("播放器未加载完成，请稍后重试");
      return;
    }
    // 已在播放
    if (this.player.playing()) {
      statusStore.playStatus = true;
      return;
    }
    this.player.play();
    statusStore.playStatus = true;
    // 淡入
    await new Promise<void>((resolve) => {
      this.player.once("play", () => {
        this.player.fade(0, statusStore.playVolume, settingStore.getFadeTime);
        resolve();
      });
    });
  }

  /**
   * 暂停
   * @param changeStatus 是否更改播放状态
   */
  async pause(changeStatus: boolean = true) {
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();

    // 播放器未加载完成或不存在
    if (!this.player || this.player.state() !== "loaded") {
      if (changeStatus) statusStore.playStatus = false;
      return;
    }

    // 淡出
    await new Promise<void>((resolve) => {
      this.player.fade(statusStore.playVolume, 0, settingStore.getFadeTime);
      this.player.once("fade", () => {
        this.player.pause();
        if (changeStatus) statusStore.playStatus = false;
        resolve();
      });
    });
  }

  /**
   * 播放或暂停
   */
  async playOrPause() {
    const statusStore = useStatusStore();
    if (statusStore.playStatus) await this.pause();
    else await this.play();
  }

  /**
   * 下一首或上一首
   * @param type 切换类别 next 下一首 prev 上一首
   * @param play 是否立即播放
   * @param autoEnd 是否为歌曲自动播放结束
   */
  async nextOrPrev(type: "next" | "prev" = "next", play: boolean = true, autoEnd: boolean = false) {
    const statusStore = useStatusStore();
    const dataStore = useDataStore();
    try {
      // 获取数据
      const { playList } = dataStore;
      const { playSongMode } = statusStore;
      if (this.switching) {
        console.log("🔄 Already switching, ignoring request");
        return;
      }
      this.switching = true;
      // 立即更新UI状态，防止用户重复点击
      statusStore.playLoading = true;
      statusStore.playStatus = false;

      // 若为私人FM
      if (statusStore.radioMode) {
        await this.nextRadio(false, true);
        return;
      }
      // 列表长度
      const playListLength = playList.length;
      // 播放列表是否为空
      if (playListLength === 0) throw new Error("Play list is empty");
      // 只有一首歌的特殊处理
      if (playListLength === 1) {
        statusStore.playLoading = false;
        this.setSeek(0);
        await this.play();
        return;
      }
      // 单曲循环
      if (playSongMode === "repeat-once" && autoEnd) {
        statusStore.playLoading = false;
        this.setSeek(0);
        await this.play();
        return;
      }

      // 列表循环、单曲循环（手动切歌）、处于心动模式或随机模式
      if (
        playSongMode === "repeat" ||
        playSongMode === "repeat-once" ||
        playSongMode === "shuffle" ||
        statusStore.radioMode
      ) {
        statusStore.playIndex += type === "next" ? 1 : -1;
      } else {
        throw new Error("The play mode is not supported");
      }
      // 索引是否越界
      if (statusStore.playIndex < 0) {
        statusStore.playIndex = playListLength - 1;
      } else if (statusStore.playIndex >= playListLength) {
        statusStore.playIndex = 0;
      }
      // 立即清理定时器，防止旧定时器继续更新UI
      this.cleanupAllTimers();
      // 重置播放进度（切换歌曲时必须重置）
      statusStore.currentTime = 0;
      statusStore.progress = 0;
      // 暂停当前播放
      await this.pause(false);
      // 初始化播放器（不传入seek参数，确保从头开始播放）
      await this.initPlayer(play, 0);
    } catch (error) {
      console.error("Error in nextOrPrev:", error);
      statusStore.playLoading = false;
      throw error;
    } finally {
      this.switching = false;
    }
  }

  /**
   * 切换播放模式
   * @param mode 播放模式 repeat / repeat-once / shuffle
   */
  async togglePlayMode(mode: PlayModeType | false) {
    const statusStore = useStatusStore();
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    // 若传入了指定模式
    // 计算目标模式
    let targetMode: PlayModeType;
    if (mode) {
      targetMode = mode;
    } else {
      switch (statusStore.playSongMode) {
        case "repeat":
          targetMode = "repeat-once";
          break;
        case "shuffle":
          targetMode = "repeat";
          break;
        case "repeat-once":
          targetMode = "shuffle";
          break;
        default:
          targetMode = "repeat";
      }
    }

    // 进入随机模式：保存原顺序并打乱当前歌单
    if (targetMode === "shuffle" && statusStore.playSongMode !== "shuffle") {
      const currentList = dataStore.playList;
      if (currentList && currentList.length > 1) {
        const currentSongId = musicStore.playSong?.id;
        await dataStore.setOriginalPlayList(currentList);
        const shuffled = shuffleArray(currentList);
        await dataStore.setPlayList(shuffled);
        if (currentSongId) {
          const newIndex = shuffled.findIndex((s: any) => s?.id === currentSongId);
          if (newIndex !== -1) useStatusStore().playIndex = newIndex;
        }
      }
    }
    // 离开随机模式：恢复到原顺序
    if (
      statusStore.playSongMode === "shuffle" &&
      (targetMode === "repeat" || targetMode === "repeat-once")
    ) {
      const original = await dataStore.getOriginalPlayList();
      if (original && original.length) {
        const currentSongId = musicStore.playSong?.id;
        await dataStore.setPlayList(original);
        if (currentSongId) {
          const origIndex = original.findIndex((s: any) => s?.id === currentSongId);
          useStatusStore().playIndex = origIndex !== -1 ? origIndex : 0;
        } else {
          useStatusStore().playIndex = 0;
        }
        await dataStore.clearOriginalPlayList();
      }
    }
    // 应用模式
    statusStore.playSongMode = targetMode;
    this.playModeSyncIpc();
  }

  /**
   * 播放模式同步 ipc
   */
  playModeSyncIpc() {
    const statusStore = useStatusStore();
    if (isElectron) {
      window.electron.ipcRenderer.send("play-mode-change", statusStore.playSongMode);
    }
  }

  /**
   * 设置播放进度
   * @param time 播放进度
   */
  setSeek(time: number) {
    const statusStore = useStatusStore();
    // 检查播放器状态
    if (!this.player || this.player.state() !== "loaded") {
      console.warn("⚠️ Player not ready for seek");
      return;
    }
    time = Math.max(0, Math.min(time, this.player.duration()));
    this.player.seek(time);
    statusStore.currentTime = time;
  }

  /**
   * 获取播放进度
   * @returns 播放进度
   */
  getSeek(): number {
    // 检查播放器状态
    if (!this.player || this.player.state() !== "loaded") return 0;
    return this.player.seek();
  }

  /**
   * 设置播放速率
   * @param rate 播放速率
   */
  setRate(rate: number) {
    const statusStore = useStatusStore();
    this.player.rate(rate);
    statusStore.playRate = rate;
  }

  /**
   * 设置播放音量
   * @param actions 音量
   */
  setVolume(actions: number | "up" | "down" | WheelEvent) {
    const statusStore = useStatusStore();
    const increment = 0.05;
    // 直接设置
    if (typeof actions === "number") {
      actions = Math.max(0, Math.min(actions, 1));
    }
    // 分类调节
    else if (actions === "up" || actions === "down") {
      statusStore.playVolume = Math.max(
        0,
        Math.min(statusStore.playVolume + (actions === "up" ? increment : -increment), 1),
      );
    }
    // 鼠标滚轮
    else {
      const deltaY = actions.deltaY;
      const volumeChange = deltaY > 0 ? -increment : increment;
      statusStore.playVolume = Math.max(0, Math.min(statusStore.playVolume + volumeChange, 1));
    }
    // 调整音量
    this.player.volume(statusStore.playVolume);
  }

  /**
   * 切换静音
   */
  toggleMute() {
    const statusStore = useStatusStore();
    // 是否静音
    const isMuted = statusStore.playVolume === 0;
    // 恢复音量
    if (isMuted) {
      statusStore.playVolume = statusStore.playVolumeMute;
    }
    // 保存当前音量并静音
    else {
      statusStore.playVolumeMute = this.player.volume();
      statusStore.playVolume = 0;
    }
    this.player.volume(statusStore.playVolume);
  }

  /**
   * 更新播放列表
   * @param data 播放列表
   * @param song 当前播放歌曲
   * @param playlist
   * @param options 配置
   * @param options.showTip 是否显示提示
   * @param options.scrobble 是否打卡
   * @param options.play 是否直接播放
   */
  async updatePlayList(
    data: SongInfo[],
    song?: SongInfo,
    playlist: {
      id?: string;
      platform?: string;
      type?: string;
    } = {
      id: "",
      platform: "",
      type: "",
    },
    options: {
      showTip?: boolean;
      scrobble?: boolean;
      play?: boolean;
    } = {
      showTip: true,
      scrobble: true,
      play: true,
    },
  ) {
    if (!data || !data.length) return;
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    // 获取配置
    const { showTip, scrobble, play } = options;

    // 处理随机播放模式
    let processedData = cloneDeep(data);
    if (statusStore.playSongMode === "shuffle") {
      // 保存原始播放列表
      await dataStore.setOriginalPlayList(cloneDeep(data));
      // 随机排序
      processedData = shuffleArray(processedData);
    }
    // 更新列表
    await dataStore.setPlayList(processedData);
    // 打卡
    if (scrobble) this.scrobbleSong();
    // 更新列表
    await dataStore.setPlayList(cloneDeep(data));

    if (statusStore.radioMode) statusStore.radioMode = false;
    // 是否直接播放
    if (song && typeof song === "object" && "id" in song) {
      // 是否为当前播放歌曲
      if (musicStore.playSong.id === song.id && musicStore.playSong.platform === song.platform) {
        if (play) await this.play();
      } else {
        // 查找索引
        statusStore.playIndex = data.findIndex(
          (item) => item.id === song.id && item.platform === song.platform,
        );
        // 播放
        await this.pause(false);
        await this.initPlayer();
      }
    } else {
      statusStore.playIndex =
        statusStore.playSongMode === "shuffle" ? Math.floor(Math.random() * data.length) : 0;
      // 播放
      await this.pause(false);
      await this.initPlayer();
    }
    // 更改播放歌单
    musicStore.playPlaylist.type = playlist.type || "";
    musicStore.playPlaylist.id = playlist.id || "";
    musicStore.playPlaylist.platform = playlist.platform || "";

    if (showTip) window.$message.success("已开始播放");
  }

  /**
   * 添加下一首歌曲
   * @param song 歌曲
   * @param play 是否立即播放
   */
  async addNextSong(song: SongInfo, play: boolean = false) {
    console.log("addNextSong", song);
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();

    // 关闭特殊模式
    if (statusStore.radioMode) statusStore.radioMode = false;
    // 是否为当前播放歌曲
    if (musicStore.playSong.id === song.id && musicStore.playSong.platform === song.platform) {
      this.play();
      window.$message.success(t("message.play_started"));
      return;
    }
    // 尝试添加
    const songIndex = await dataStore.setNextPlaySong(song, statusStore.playIndex);
    // 播放歌曲
    if (songIndex < 0) return;
    if (play) this.togglePlayIndex(songIndex, true);
    else window.$message.success(t("message.added_to_next_play"));
  }

  /**
   * 切换播放索引
   * @param index 播放索引
   * @param play 是否立即播放
   */
  async togglePlayIndex(index: number, play: boolean = false) {
    const dataStore = useDataStore();
    const statusStore = useStatusStore();
    try {
      if (this.switching) {
        console.log("🔄 Already switching, ignoring request");
        return;
      }
      this.switching = true;
      // 立即更新UI状态，防止用户重复点击
      statusStore.playLoading = true;
      statusStore.playStatus = false;
      // 获取数据
      const { playList } = dataStore;
      // 若超出播放列表
      if (index >= playList.length) return;
      // 相同
      if (!play && statusStore.playIndex === index) {
        this.play();
        return;
      }
      // 更改状态
      statusStore.playIndex = index;
      // 重置播放进度（切换歌曲时必须重置）
      statusStore.currentTime = 0;
      statusStore.progress = 0;
      statusStore.lyricIndex = -1;
      // 暂停当前播放
      await this.pause(false);
      // 清理定时器，防止旧定时器继续运行
      this.cleanupAllTimers();
      // 清理并播放（不传入seek参数，确保从头开始播放）
      await this.initPlayer(true, 0);
    } catch (error) {
      console.error("Error in togglePlayIndex:", error);
      statusStore.playLoading = false;
      throw error;
    } finally {
      this.switching = false;
    }
  }

  /**
   * 移除指定歌曲
   * @param index 歌曲索引
   */
  removeSongIndex(index: number) {
    const dataStore = useDataStore();
    const statusStore = useStatusStore();
    // 获取数据
    const { playList } = dataStore;
    // 若超出播放列表
    if (index >= playList.length) return;
    // 仅剩一首
    if (playList.length === 1) {
      this.cleanPlayList();
      return;
    }
    // 深拷贝，防止影响原数据
    const newPlaylist = cloneDeep(playList);
    // 是否为当前播放歌曲
    const isCurrentPlay = statusStore.playIndex === index;
    // 若将移除最后一首
    if (index === playList.length - 1) {
      statusStore.playIndex = 0;
    }
    // 若为当前播放之后
    else if (statusStore.playIndex > index) {
      statusStore.playIndex--;
    }
    // 移除指定歌曲
    newPlaylist.splice(index, 1);
    dataStore.setPlayList(newPlaylist);
    // 若为当前播放
    if (isCurrentPlay) {
      this.initPlayer(statusStore.playStatus);
    }
  }

  /**
   * 清空播放列表
   */
  async cleanPlayList() {
    const dataStore = useDataStore();
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    // 停止播放
    Howler.unload();
    // 清空数据
    this.resetStatus();
    statusStore.$patch({
      playListShow: false,
      showFullPlayer: false,
      radioMode: false,
      playIndex: -1,
    });
    musicStore.$reset();
    dataStore.setPlayList([]);

    console.log("songInfo", musicStore.playSong);
    window.$message.success(t("message.play_list_cleared"));

    // ipc
    if (isElectron) {
      window.electron.ipcRenderer.send("play-song-change", null);
      window.electron.ipcRenderer.send("like-status-change", false);
      window.electron.ipcRenderer.send(
        "update-desktop-lyric-data",
        cloneDeep({
          playStatus: false,
          playName: null,
          currentTime: 0,
          songId: null,
          songOffset: 0,
          lrcData: [],
          yrcData: [],
          lyricIndex: -1,
        }),
      );
    }
  }

  /**
   * 切换输出设备
   * @param deviceId 输出设备
   */
  toggleOutputDevice(deviceId?: string) {
    try {
      const settingStore = useSettingStore();
      // 输出设备
      const devices = deviceId ?? settingStore.playDevice;
      if (!(this.player as any)?._sounds.length) return;
      // 获取音频元素
      const audioDom = this.getAudioDom();
      // 设置输出设备
      if (devices && audioDom?.setSinkId) {
        audioDom.setSinkId(devices);
      }
    } catch (error) {
      console.error("Failed to change audio output device:", error);
    }
  }

  /**
   * 初始化音频可视化
   */
  initSpectrumData() {
    try {
      if (this.audioContext || !isElectron) return;
      // 获取音频元素
      const audioDom = this.getAudioDom();
      if (!audioDom) return;
      // 通过统一管理器创建/获取基础图
      const nodes = audioContextManager.getOrCreateBasicGraph(audioDom);
      if (!nodes) return;
      // 记录节点
      this.audioContext = nodes.context;
      this.analyser = nodes.analyser;
      // 可视化保持与原有行为一致：连接到输出
      this.analyser.connect(this.audioContext.destination);
      // 配置数据缓冲
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      // 更新频谱数据
      this.generateSpectrumData();
      console.log("🎼 Initialize music spectrum successfully");
    } catch (error) {
      console.error("🎼 Initialize music spectrum failed:", error);
    }
  }

  /**
   * 启用均衡器
   * @param options 配置
   * @param options.bands 各频段 dB 值（与 frequencies 对齐），直接写入 filter.gain
   * @param options.preamp 前级增益 dB，转换为线性增益写入 preGain.gain
   * @param options.q peaking 类型的 Q 值统一更新（shelf 不适用 Q）
   * @param options.frequencies 自定义中心频率
   */
  enableEq(options?: { bands?: number[]; preamp?: number; q?: number; frequencies?: number[] }) {
    if (!isElectron) return;
    const audioDom = this.getAudioDom();
    if (!audioDom) return;
    const nodes = audioContextManager.enableEq(audioDom, options);
    if (!nodes) return;
    // 连接到输出，确保声音从 WebAudio 输出
    try {
      nodes.analyser.connect(nodes.context.destination);
    } catch {
      /* empty */
    }
  }

  /**
   * 更新均衡器参数
   * @param options 配置
   * @param options.bands 各频段 dB 值（与 frequencies 对齐），直接写入 filter.gain
   * @param options.preamp 前级增益 dB，转换为线性增益写入 preGain.gain
   * @param options.q peaking 类型的 Q 值统一更新（shelf 不适用 Q）
   */
  updateEq(options: { bands?: number[]; preamp?: number; q?: number }) {
    if (!isElectron) return;
    const audioDom = this.getAudioDom();
    if (!audioDom) return;
    audioContextManager.updateEq(audioDom, options);
  }

  /**
   * 禁用均衡器并恢复直出（保持频谱可用）
   */
  disableEq() {
    if (!isElectron) return;
    const audioDom = this.getAudioDom();
    if (!audioDom) return;
    audioContextManager.disableEq(audioDom);
    // 恢复 analyser 输出
    const nodes = audioContextManager.getOrCreateBasicGraph(audioDom);
    if (nodes) {
      try {
        nodes.analyser.connect(nodes.context.destination);
      } catch {
        /* empty */
      }
    }
  }
  /**
   * 切换桌面歌词
   */
  toggleDesktopLyric() {
    const statusStore = useStatusStore();
    const show = !statusStore.showDesktopLyric;
    statusStore.showDesktopLyric = show;
    window.electron.ipcRenderer.send("toggle-desktop-lyric", show);
    window.$message.success(
      show ? t("message.desktop_lyrics_opened") : t("message.desktop_lyrics_closed"),
    );
  }

  /**
   * 显式设置桌面歌词显示/隐藏
   */
  setDesktopLyricShow(show: boolean) {
    const statusStore = useStatusStore();
    if (statusStore.showDesktopLyric === show) return;
    statusStore.showDesktopLyric = show;
    window.electron.ipcRenderer.send("toggle-desktop-lyric", show);
    window.$message.success(
      show ? t("message.desktop_lyrics_opened") : t("message.desktop_lyrics_closed"),
    );
  }

  /**
   * 听歌打卡
   */
  async scrobbleSong() {
    console.log("不好意思，不支持打卡");
    // const musicStore = useMusicStore();
    // const statusStore = useStatusStore();
    // const settingStore = useSettingStore();
    // try {
    //   if (!isLogin()) return;
    //   if (!settingStore.scrobbleSong) return;
    //   // 获取所需数据
    //   const playSongData = getPlaySongData();
    //   if (!playSongData) return;
    //   const { id, name } = playSongData;
    //   const sourceid = musicStore.playPlaylistId;
    //   const time = statusStore.duration;
    //   // 网易云打卡
    //   console.log("打卡：", id, name, sourceid, time);
    //   await scrobble(id, sourceid, time);
    // } catch (error) {
    //   console.error("Failed to scrobble song:", error);
    // }
  }

  // 切换音质
  async changeQuality(quality: string) {
    const statusStore = useStatusStore();
    statusStore.selectedQuality = quality;
    if (statusStore.playQuality === quality) return;
    statusStore.playQuality = quality;
    await this.initPlayer(true, statusStore.currentTime, quality);
  }

  selectPlayQuality(songInfo: SongInfo, quality: string): Link | null {
    const statusStore = useStatusStore();
    const settingStore = useSettingStore();
    const currentQuality = statusStore.playQuality;
    const songLevel = settingStore.songLevel;
    const selectedQuality = statusStore.selectedQuality;

    if (songInfo.links?.length == 0) {
      return null;
    }

    // 如果有quality 说明是切换音质
    let link = songInfo.links.find((item) => item.name === quality);
    if (link) {
      return link;
    }

    const qualityList = (
      songLevel === "auto" ? [selectedQuality, "hires", "flac", "320mp3", "128mp3"] : []
    ).concat([songLevel, currentQuality, selectedQuality]);
    for (const quality of qualityList) {
      link = songInfo.links.find((item) => item.name === quality);
      if (link) {
        return link;
      }
    }
    // 默认返回第一个
    return songInfo.links[0];
  }

  /**
   * 初始化私人FM
   * @param init 是否初始化
   * @param playNext 是否播放下一首
   */
  async nextRadio(init: boolean = true, playNext: boolean = false) {
    const musicStore = useMusicStore();
    const statusStore = useStatusStore();
    try {
      // 获取并重置
      const getPersonalFmData = async () => {
        const result = await listRadioSongs(
          musicStore.radio.id,
          musicStore.radio.platform,
          musicStore.radio.pageIndex || 1,
        );
        console.log(`🌐 radio :`, result.songs);
        musicStore.radio.playIndex = 0;
        musicStore.radio.list = result.songs;
        musicStore.radio.pageIndex = result.page_index || musicStore.radio.pageIndex;
      };
      // 若为空
      if (init || musicStore.radio.list.length === 0) {
        musicStore.radio.pageIndex = 1;
        statusStore.radioMode = true;
        await getPersonalFmData();
        // 清理并播放
        this.resetStatus();
        await this.initPlayer();
        return;
      }
      // 若需播放下一首
      if (playNext) {
        // 更改索引
        if (musicStore.radio.playIndex < musicStore.radio.list.length - 1) {
          musicStore.radio.playIndex++;
        } else {
          musicStore.radio.pageIndex++;
          await getPersonalFmData();
        }
        // 清理并播放
        this.resetStatus();
        await this.initPlayer();
      }
    } catch (error) {
      console.error("Failed to initialize radio:", error);
    }
  }
  /**
   * 开始定时关闭
   * @param time 关闭时间（分钟）
   * @param remainTime 剩余时间（秒）
   */
  startAutoCloseTimer(time: number, remainTime: number) {
    const statusStore = useStatusStore();
    if (!time || !remainTime) return;
    // 如已有定时器在运行，先停止以防叠加
    if (this.autoCloseInterval) {
      clearInterval(this.autoCloseInterval);
      this.autoCloseInterval = undefined;
    }
    // 重置剩余时间
    Object.assign(statusStore.autoClose, {
      enable: true,
      time,
      remainTime,
    });
    // 开始减少剩余时间
    this.autoCloseInterval = setInterval(() => {
      if (statusStore.autoClose.remainTime <= 0) {
        clearInterval(this.autoCloseInterval);
        this.autoCloseInterval = undefined;
        if (!statusStore.autoClose.waitSongEnd) {
          this.executeAutoClose();
        }
        return;
      }
      statusStore.autoClose.remainTime--;
    }, 1000);
  }
  /**
   * 清理所有定时器和资源
   */
  private cleanupAllTimers() {
    // 清理播放状态定时器
    if (this.playerInterval) {
      clearInterval(this.playerInterval);
      this.playerInterval = undefined;
    }
    // 清理自动关闭定时器
    if (this.autoCloseInterval) {
      clearInterval(this.autoCloseInterval);
      this.autoCloseInterval = undefined;
    }
  }

  /**
   * 执行自动关闭
   */
  private executeAutoClose() {
    console.log("🔄 执行自动关闭");
    // 暂停播放
    this.pause();
    // 重置状态
    const { autoClose } = useStatusStore();
    autoClose.enable = false;
    autoClose.remainTime = autoClose.time * 60;
  }
}

export default new Player();
