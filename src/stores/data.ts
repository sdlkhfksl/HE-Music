import { defineStore } from "pinia";
import type { CoverType, UserLikeDataType } from "@/types/main";
import { playlistCategories } from "@/api/playlist";
import { cloneDeep, isEmpty } from "lodash-es";
import localforage from "localforage";
import { SongInfo, CategoryGroupInfo, UserInfo, UserPlaylistInfo } from "@/types/main.hemusic";

interface ListState {
  playList: SongInfo[];
  historyList: SongInfo[];
  searchHistory: string[];
  localPlayList: CoverType[];
  // loginType: LoginType;
  userData: UserInfo;
  // 登录状态
  userLoginStatus: boolean;
  token: string;
  userLikeData: UserLikeDataType;
  userCreatedPlaylist: UserPlaylistInfo[]; //用户创建的歌单
  catData: Record<string, CategoryGroupInfo[]>;
}

type UserDataKeys = keyof ListState["userLikeData"];

// musicDB
const musicDB = localforage.createInstance({
  name: "music-data",
  description: "List data of the application",
  storeName: "music",
});

// userDB
const userDB = localforage.createInstance({
  name: "user-data",
  description: "User data of the application",
  storeName: "user",
});

export const useDataStore = defineStore("data", {
  state: (): ListState => ({
    // 播放列表
    playList: [],
    // 播放历史
    historyList: [],
    // 搜索历史
    searchHistory: [],
    // 本地歌单
    localPlayList: [],
    // 登录状态
    userLoginStatus: false,
    token: "",
    userCreatedPlaylist: [],
    // 用户数据
    userData: {
      id: "",
      username: "",
      email: "",
      status: 0,
      nickname: "",
      avatar: "",
    },
    // 用户喜欢数据
    userLikeData: {
      songs: [],
      playlists: [],
      artists: [],
      albums: [],
      mvs: [],
    },
    // 分类数据
    catData: {},
  }),
  getters: {
    // 是否为喜欢歌曲
    isLikeSong:
      (state) =>
      ({ id, platform }: { id: string; platform: string } = { id: "", platform: "" }) =>
        state.userLikeData.songs.some((item) => item.id === id && item.platform === platform),
  },
  actions: {
    async loadData() {
      try {
        // 获取 music-data
        const musicDataKeys = await musicDB.keys();
        console.log(musicDataKeys);
        await Promise.all(
          musicDataKeys.map(async (key) => {
            const data = await musicDB.getItem(key);
            this[key] = data || [];
          }),
        );
        // 获取 user-data
        const userDataKeys = await userDB.keys();
        await Promise.all(
          userDataKeys.map(async (key) => {
            const data = await userDB.getItem(key);
            this.userLikeData[key] = data;
          }),
        );
      } catch (error) {
        console.error("Error loading data from localforage:", error);
      }
    },
    // 更新播放列表
    async setPlayList(data: SongInfo | SongInfo[]): Promise<number> {
      try {
        // 若为列表
        if (Array.isArray(data)) {
          this.playList = data;
          // 更新本地存储
          data = cloneDeep(data);
          await musicDB.setItem("playList", data);
          return 0;
        }
        // 若为单曲
        else {
          // 若为单曲
          const song = cloneDeep(data as SongInfo);
          // 歌曲去重
          const playList = this.playList.filter(
            (item) => item.id !== song.id || item.platform !== song.platform,
          );
          // 添加到歌单末尾
          playList.push(song);
          // 获取索引
          const index = playList.length - 1;
          // 更新本地存储
          this.playList = playList;
          await musicDB.setItem("playList", playList);
          return index;
        }
      } catch (error) {
        console.error("Error updating playlist:", error);
        throw error;
      }
    },
    // 新增下一首播放歌曲
    async setNextPlaySong(song: SongInfo, index: number): Promise<number> {
      if (this.playList.length === 0) {
        this.playList = [song];
        await musicDB.setItem("playList", cloneDeep(this.playList));
        return 0;
      }

      const indexAdd = index + 1;
      this.playList.splice(indexAdd, 0, song);
      // 再移除重复的歌曲
      const playList = this.playList.filter(
        (item, idx) => idx === indexAdd || item.id !== song.id || item.platform !== song.platform,
      );

      // 更新本地存储
      this.playList = playList;
      await musicDB.setItem("playList", cloneDeep(playList));
      // 返回刚刚插入的歌曲索引
      return playList.findIndex((item) => item.id === song.id && item.platform === song.platform);
    },
    // 更改播放历史
    async setHistory(song: SongInfo) {
      try {
        let historyList: ListState["historyList"] | null = await musicDB.getItem("historyList");
        // 是否无数据
        if (historyList === null) {
          historyList = [];
        } else if (!Array.isArray(historyList)) return;
        // 深拷贝
        song = cloneDeep(song);
        // 添加到首项并移除重复项
        const updatedList = [
          song,
          ...historyList.filter((item) => item.id !== song.id || item.platform !== song.platform),
        ];
        // 最多 500 首
        if (updatedList.length > 500) updatedList.splice(500);
        await musicDB.setItem("historyList", updatedList);
        // 更新播放历史
        this.historyList = updatedList as SongInfo[];
      } catch (error) {
        console.error("Error updating history:", error);
        throw error;
      }
    },
    // 清除播放历史
    async clearHistory(): Promise<void> {
      try {
        await musicDB.setItem("historyList", []);
        this.historyList = [];
      } catch (error) {
        console.error("Error clearing history:", error);
        throw error;
      }
    },
    // 更改用户数据
    async setUserLikeData<K extends UserDataKeys>(
      name: K,
      data: ListState["userLikeData"][K],
    ): Promise<void> {
      try {
        // 更新本地存储
        await userDB.setItem(name, cloneDeep(data));
        this.userLikeData[name] = data;
      } catch (error) {
        console.error("Error updating user data:", error);
        throw error;
      }
    },
    // 清除用户数据
    async clearUserData() {
      try {
        this.userLoginStatus = false;
        this.token = "";
        this.userCreatedPlaylist = [];
        this.userData = {
          id: "",
          username: "",
          email: "",
          status: 0,
          nickname: "",
          avatar: "",
        };
        await Promise.all(
          Object.keys(this.userLikeData).map(async (key) => {
            const userDataKey = key as UserDataKeys;
            await this.setUserLikeData(userDataKey, []);
            this.userLikeData[userDataKey] = [];
          }),
        );
      } catch (error) {
        console.error("Error clearing user data:", error);
        throw error;
      }
    },
    // 删除数据库
    async deleteDB(name?: string): Promise<void> {
      try {
        if (name) {
          await localforage.dropInstance({ name });
          console.log(`Dropped ${name} database`);
          return;
        }
        await musicDB.clear();
        await userDB.clear();
        console.log("All databases cleared");
      } catch (error) {
        console.error("Error deleting database:", error);
        throw error;
      }
    },
    // 获取歌单分类
    async getPlaylistCatList(platform: string) {
      if (!isEmpty(this.catData[platform])) return;
      // 获取歌单分类
      try {
        const res = await playlistCategories(platform);
        this.catData[platform] = res.groups;
      } catch (error) {
        console.error("Error getting playlist cat list:", error);
        throw error;
      }
    },
  },
  // 持久化
  persist: {
    key: "data-store",
    storage: localStorage,
    pick: ["userLoginStatus", "userData", "searchHistory", "token"],
  },
});
