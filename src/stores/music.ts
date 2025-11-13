import { defineStore } from "pinia";
import type { LyricLine } from "@applemusic-like-lyrics/core";
import type { LyricType } from "@/types/main";
import { SongInfo } from "@/types/main.hemusic";
import { getSizeCover } from "@/utils/format";
import { isElectron } from "@/utils/env";
import { cloneDeep } from "lodash-es";

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
  // 电台
  radio: {
    id: string;
    platform: string;
    list: SongInfo[];
    playIndex: number;
    pageIndex: number;
  };
}

// 默认音乐数据
const defaultMusicData: SongInfo = {
  id: "",
  platform: "",
  name: "未播放歌曲",
  artists: "未知歌手",
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
    radio: {
      id: "", // 电台id
      platform: "", // 电台平台
      list: [], // 电台歌曲
      playIndex: 0, // 电台播放索引
      pageIndex: 1, // 电台页码
    },
  }),
  getters: {
    isLocalSong(state): boolean {
      return !!state.playSong?.path;
    },
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
    // 获取歌曲封面
    getSongCover:
      (state) =>
      (size: number = 300): string => {
        return state.playSong.path ? state.playSong.cover : getSizeCover(state.playSong, size);
      },

    // 电台歌曲
    radioSong(state): SongInfo {
      return state.radio.list?.[state.radio.playIndex] || defaultMusicData;
    },
  },
  actions: {
    /**
     * 设置/更新歌曲歌词数据
     * @param updates 部分或完整歌词数据
     * @param replace 是否覆盖（true：用提供的数据覆盖并为缺省字段置空；false：合并更新）
     */
    setSongLyric(updates: Partial<MusicState["songLyric"]>, replace: boolean = false) {
      if (replace) {
        this.songLyric = {
          lrcData: updates.lrcData ?? [],
          yrcData: updates.yrcData ?? [],
          lrcAMData: updates.lrcAMData ?? [],
          yrcAMData: updates.yrcAMData ?? [],
        };
      } else {
        this.songLyric = {
          lrcData: updates.lrcData ?? this.songLyric.lrcData,
          yrcData: updates.yrcData ?? this.songLyric.yrcData,
          lrcAMData: updates.lrcAMData ?? this.songLyric.lrcAMData,
          yrcAMData: updates.yrcAMData ?? this.songLyric.yrcAMData,
        };
      }
      // 更新歌词窗口数据
      if (isElectron) {
        window.electron.ipcRenderer.send(
          "play-lyric-change",
          cloneDeep({
            songId: this.playSong?.id,
            lrcData: this.songLyric.lrcData ?? [],
            yrcData: this.songLyric.yrcData ?? [],
          }),
        );
      }
    },
  },
  // 持久化
  persist: {
    key: "music-store",
    storage: localStorage,
  },
});
