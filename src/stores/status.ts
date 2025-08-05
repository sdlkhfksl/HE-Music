import { defineStore } from "pinia";
import type { ColorScheme, PlayModeType, RGB, SortType } from "@/types/main";

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
  currentTime: number;
  duration: number;
  progress: number;
  currentTimeOffset: number;
  playUblock: boolean;
  mainContentHeight: number;
  listSort: SortType;
  showDesktopLyric: boolean;
  showPlayerComment: boolean;
  updateCheck: boolean;
  playQuality: string;
  radioMode: boolean;
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
    playLoading: false,
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
    // 电台模式
    radioMode: false,
  }),
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
  actions: {},
  // 持久化
  persist: {
    key: "status-store",
    storage: localStorage,
    pick: [
      "menuCollapsed",
      "currentTime",
      "duration",
      "progress",
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
      "radioMode",
    ],
  },
});
