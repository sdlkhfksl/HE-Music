import { defineStore } from "pinia";
import type { ColorScheme, PlayModeType, RGB, SortType } from "@/types/main";
import type { SongInfo } from "@/types/main.hemusic";

interface StatusState {
  menuCollapsed: boolean;
  searchFocus: boolean;
  searchInputValue: string;
  showPlayBar: boolean;
  showFullPlayer: boolean;
  fullPlayerActive: boolean;
  playerMetaShow: boolean;
  playListShow: boolean;
  playStatus: boolean;
  playLoading: boolean;
  playRate: number;
  playVolume: number;
  playVolumeMute: number;
  playSongMode: PlayModeType;
  songCoverTheme: {
    main?: RGB;
    light?: ColorScheme;
    dark?: ColorScheme;
  };
  spectrumsData: number[];
  pureLyricMode: boolean;
  playIndex: number;
  lyricIndex: number;
  /** 歌词加载状态 */
  lyricLoading: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  /** 每首歌曲的进度偏移（按歌曲 id-platform 记忆） */
  currentTimeOffsetMap: Record<string, number>;
  currentTimeOffset: number;
  playUblock: boolean;
  mainContentHeight: number;
  listSort: SortType;
  showDesktopLyric: boolean;
  showPlayerComment: boolean;
  updateCheck: boolean;
  playQuality: string;
  selectedQuality: string;
  radioMode: boolean;
  /** 均衡器是否开启 */
  eqEnabled: boolean;
  /** 均衡器 10 段增益（dB） */
  eqBands: number[];
  /** 均衡器当前预设 key */
  eqPreset: string;
  /** 自动关闭 */
  autoClose: {
    /** 自动关闭 */
    enable: boolean;
    /** 自动关闭时间（分钟） */
    time: number;
    /** 剩余时长（秒） */
    remainTime: number;
    /** 等待歌曲结束 */
    waitSongEnd: boolean;
  };
}

export const useStatusStore = defineStore("status", {
  state: (): StatusState => ({
    // 菜单折叠状态
    menuCollapsed: false,
    // 搜索框状态
    searchFocus: false,
    searchInputValue: "",
    // 播放控制条
    showPlayBar: true,
    // 播放状态
    playStatus: false,
    playLoading: true,
    playUblock: false,
    // 播放列表状态
    playListShow: false,
    // 全屏播放器状态
    showFullPlayer: false,
    // 全屏播放器激活状态
    fullPlayerActive: false,
    // 播放器功能显示
    playerMetaShow: true,
    // 实时播放进度
    currentTime: 0,
    duration: 0,
    progress: 0,
    currentTimeOffsetMap: {},
    // 进度偏移
    currentTimeOffset: 0,
    // 封面主题
    songCoverTheme: {},
    // 纯净歌词模式
    pureLyricMode: false,
    // 音乐频谱数据
    spectrumsData: [],
    // 当前播放索引
    playIndex: -1,
    // 歌词播放索引
    lyricIndex: -1,
    lyricLoading: false,
    // 默认倍速
    playRate: 1,
    // 默认音量
    playVolume: 0.7,
    // 静音前音量
    playVolumeMute: 0,
    // 播放模式
    playSongMode: "repeat",
    // 主内容高度
    mainContentHeight: 0,
    // 列表排序
    listSort: "default",
    // 桌面歌词
    showDesktopLyric: false,
    // 播放器评论
    showPlayerComment: false,
    // 更新检查
    updateCheck: false,
    // 播放音质
    playQuality: "320mp3",
    // 用户选择的音质
    selectedQuality: "320mp3",
    // 电台模式
    radioMode: false,

    eqEnabled: false,
    eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    eqPreset: "acoustic",
    autoClose: {
      enable: false,
      time: 30,
      remainTime: 0,
      waitSongEnd: true,
    },
  }),
  actions: {
    /**
     * 获取指定歌曲的偏移
     * 单位：毫秒
     */
    getSongOffset(song?: SongInfo): number {
      if (!song) return 0;
      const offsetTime = this.currentTimeOffsetMap?.[`${song.platform}-${song.id}`] ?? 0;
      return Math.floor(offsetTime * 1000);
    },
    /** 设置指定歌曲的偏移 */
    setSongOffset(song?: SongInfo, offset: number = 0) {
      if (!song) return;
      if (!this.currentTimeOffsetMap) this.currentTimeOffsetMap = {};
      const offsetSeconds = offset / 1000;
      const fixed = Number(offsetSeconds.toFixed(2));
      if (fixed === 0) {
        // 为 0 时移除记录，避免占用空间
        delete this.currentTimeOffsetMap[`${song.platform}-${song.id}`];
      } else {
        this.currentTimeOffsetMap[`${song.platform}-${song.id}`] = fixed;
      }
    },
    /** 调整指定歌曲的偏移（增量） */
    incSongOffset(song?: SongInfo, delta: number = 500) {
      if (!song) return;
      const current = this.getSongOffset(song);
      const next = current + delta;
      if (next === 0) {
        delete this.currentTimeOffsetMap[`${song.platform}-${song.id}`];
      } else {
        this.setSongOffset(song, next);
      }
    },
    /** 重置指定歌曲的偏移为 0 */
    resetSongOffset(song?: SongInfo) {
      if (!song) return;
      // 直接删除该歌曲记录
      if (this.currentTimeOffsetMap && `${song.platform}-${song.id}` in this.currentTimeOffsetMap) {
        delete this.currentTimeOffsetMap[`${song.platform}-${song.id}`];
      }
    },
    /**
     * 设置 EQ 开关
     * @param enabled 是否开启
     */
    setEqEnabled(enabled: boolean) {
      this.eqEnabled = enabled;
    },
    /**
     * 设置 EQ 10 段增益（dB）
     * @param bands 长度 10 的 dB 数组
     */
    setEqBands(bands: number[]) {
      if (Array.isArray(bands) && bands.length === 10) {
        this.eqBands = [...bands];
      }
    },
    /**
     * 设置 EQ 预设名
     */
    setEqPreset(preset: string) {
      this.eqPreset = preset;
    },
  },
  getters: {
    // 播放音量图标
    playVolumeIcon(state) {
      const volume = state.playVolume;
      return volume === 0
        ? "VolumeOff"
        : volume < 0.4
          ? "VolumeMute"
          : volume < 0.7
            ? "VolumeDown"
            : "VolumeUp";
    },
    // 播放模式图标
    playModeIcon(state) {
      const mode = state.playSongMode;
      return mode === "repeat" ? "Repeat" : mode === "repeat-once" ? "RepeatSong" : "Shuffle";
    },
    // 音量百分比
    playVolumePercent(state) {
      return Math.round(state.playVolume * 100);
    },
    // 播放器主色
    mainColor(state) {
      const mainColor = state.songCoverTheme?.main;
      if (!mainColor) return "239, 239, 239";
      return `${mainColor.r}, ${mainColor.g}, ${mainColor.b}`;
    },
  },
  // 持久化
  persist: {
    key: "status-store",
    storage: localStorage,
    pick: [
      "menuCollapsed",
      "currentTime",
      "duration",
      "progress",
      "currentTimeOffsetMap",
      "pureLyricMode",
      "playIndex",
      "playRate",
      "playVolume",
      "playVolumeMute",
      "playSongType",
      "playSongMode",
      "songCoverTheme",
      "listSort",
      "showDesktopLyric",
      "playQuality",
      "selectedQuality",
      "radioMode",
      "autoClose",
      "eqEnabled",
      "eqBands",
      "eqPreset",
    ],
  },
});
