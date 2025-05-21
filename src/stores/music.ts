import { defineStore } from "pinia";
import type { LyricLine } from "@applemusic-like-lyrics/core";
import type { LyricType } from "@/types/main";
import { SongInfo } from "@/types/main.hemusic";
import { getSizeCover } from "@/utils/format";

interface MusicState {
  playSong: SongInfo;
  playPlaylist: {
    id: string;
    platform: string;
    type: string;
  };
  songLyric: {
    lrcData: LyricType[];
    yrcData: LyricType[];
    lrcAMData: LyricLine[];
    yrcAMData: LyricLine[];
  };
}

// 默认音乐数据
const defaultMusicData: SongInfo = {
  id: "",
  platform: "",
  name: "未播放歌曲",
  singers: "未知歌手",
  album: "未知专辑",
  cover: "/images/song.jpg?assest",
  duration: 0,
  mv_id: "",
  subtitle: "",
  links: [],
  sublist: [],
};

export const useMusicStore = defineStore("music", {
  state: (): MusicState => ({
    // 当前播放歌曲
    playSong: { ...defaultMusicData },
    playPlaylist: {
      id: "",
      platform: "",
      type: "",
    },
    // 当前歌曲歌词
    songLyric: {
      lrcData: [], // 普通歌词
      yrcData: [], // 逐字歌词
      lrcAMData: [], // 普通歌词-AM
      yrcAMData: [], // 逐字歌词-AM
    },
  }),
  getters: {
    // 是否具有歌词
    isHasLrc(state): boolean {
      return state.songLyric.lrcData.length > 0;
    },
    // 是否具有逐字歌词
    isHasYrc(state): boolean {
      return state.songLyric.yrcData.length > 0;
    },
    // 是否有播放器
    isHasPlayer(state): boolean {
      return !!state.playSong?.id;
    },
    // 歌曲封面
    songCover(state): string {
      return state.playSong.path ? state.playSong.cover : getSizeCover(state.playSong);
    },
    isPlayingPlaylist:
      (state) =>
      (id: string, platform: string, type: string): boolean => {
        return (
          !!state.playPlaylist.id &&
          state.playPlaylist.id === id &&
          state.playPlaylist.platform === platform &&
          state.playPlaylist.type === type
        );
      },
  },
  actions: {
    // 获取歌曲封面
    getSongCover(size: number = 300) {
      return this.playSong.path ? this.playSong.cover : getSizeCover(this.playSong, size);
    },
  },
  // 持久化
  persist: {
    key: "music-store",
    storage: localStorage,
  },
});
