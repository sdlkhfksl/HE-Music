import {
  likeAlbum,
  likePlaylist,
  likeSinger,
  likeSong,
  unlikeAlbum,
  unlikePlaylist,
  unlikeSinger,
  unlikeSong,
  userAccount,
  userFavouriteAlbum,
  userFavouriteArtist,
  userFavouritePlaylist,
  userFavouriteSong,
} from "@/api/user";
import { useDataStore } from "@/stores";
import { debounce, isFunction } from "lodash-es";
import { isElectron } from "./helper";
import {
  AlbumInfo,
  IDPlatformInfo,
  PlaylistInfo,
  SingerInfo,
  SongInfo,
} from "@/types/main.hemusic";
import { deleteSongFromPlaylist, getUserPlaylists } from "@/api/userplaylist";

/**
 * 用户是否登录
 */
export const isLogin = (): boolean => {
  const dataStore = useDataStore();
  return dataStore.userLoginStatus;
};

// 退出登录
export const toLogout = async () => {
  const dataStore = useDataStore();
  // 退出登录
  // await logout();
  sessionStorage.clear();
  // 清除用户数据
  await dataStore.clearUserData();
  window.$message.success("成功退出登录");
};


export const updateUserAccountInfo = async () => {
  if (!isLogin()) return;
  const dataStore = useDataStore();
  // userId
  const userInfo = await userAccount();
  // 更改用户信息
  dataStore.userData = {
    ...userInfo,
  };
};
// 更新用户信息
export const updateUserData = async () => {
  try {
    if (!isLogin()) return;

    // 先更新用户信息
    await updateUserAccountInfo();

    // 获取用户喜欢数据
    const allUserLikeResult = await Promise.allSettled([
      updateUserLikeSongs(),
      updateUserCreatedPlaylist(),
      updateUserLikePlaylist(),
      updateUserLikeArtists(),
      updateUserLikeAlbums(),
      // updateUserLikeMvs(),
      // 每日推荐
      // updateDailySongsData(),
    ]);
    // 若部分失败
    const hasFailed = allUserLikeResult.some((result) => result.status === "rejected");
    if (hasFailed) throw new Error("Failed to update some user data");
  } catch (error) {
    console.error("❌ Error updating user data:", error);
    throw error;
  }
};

// 更新用户喜欢歌曲
export const updateUserLikeSongs = async () => {
  const dataStore = useDataStore();
  if (!isLogin() || !dataStore.userData.id) return;
  const result = await userFavouriteSong(0, 1);
  dataStore.setUserLikeData("songs", result.list);
};

// 更新用户喜欢歌单
export const updateUserLikePlaylist = async () => {
  const dataStore = useDataStore();
  const userId = dataStore.userData.id;
  if (!isLogin() || !userId) return;
  const result = await userFavouritePlaylist(0, 1);
  dataStore.setUserLikeData("playlists", result.list);
};

// 更新用户喜欢歌手
export const updateUserLikeArtists = async () => {
  const dataStore = useDataStore();
  const userId = dataStore.userData.id;
  if (!isLogin() || !userId) return;
  const result = await userFavouriteArtist(0, 1);
  dataStore.setUserLikeData("artists", result.list);
};

// 更新用户喜欢专辑
export const updateUserLikeAlbums = async () => {
  const dataStore = useDataStore();
  const userId = dataStore.userData.id;
  if (!isLogin() || !userId) return;
  const result = await userFavouriteAlbum(0, 1);
  dataStore.setUserLikeData("albums", result.list);
};

// 更新用户喜欢歌单
export const updateUserCreatedPlaylist = async () => {
  const dataStore = useDataStore();
  const userId = dataStore.userData.id;
  if (!isLogin() || !userId) return;
  const result = await getUserPlaylists(0, 1);
  dataStore.userCreatedPlaylist = result.list;
};

// 喜欢歌曲
export const toLikeSong = debounce(
  async (song: SongInfo, like: boolean) => {
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    const dataStore = useDataStore();
    const { id, platform, path } = song;
    if (path) {
      window.$message.warning("本地歌曲暂不支持该操作");
      return;
    }
    const likeList = dataStore.userLikeData.songs;

    try {
      if (like) {
        await likeSong(id, platform);
        likeList.push({ id, platform });
        window.$message.success("已添加到我喜欢的音乐");
      } else {
        await unlikeSong(id, platform);
        const idx = likeList.findIndex((item) => item.id === id && item.platform === platform);
        likeList.splice(idx, 1);
        window.$message.success("已取消喜欢");
      }
      dataStore.setUserLikeData("songs", likeList);

      const likeSongList = dataStore.userCreatedPlaylist.find((item) => item.is_default == 1);
      if (likeSongList) {
        likeSongList.song_num = likeList.length.toString();
      }
      // ipc
      if (isElectron) window.electron.ipcRenderer.send("like-status-change", like);
    } catch {
      window.$message.error(`${like ? "喜欢" : "取消"}音乐时发生错误`);
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 收藏/取消收藏歌单
export const toLikePlaylist = debounce(
  async (info: PlaylistInfo, like: boolean) => {
    if (!info || !info.id || !info.platform) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }

    try {
      if (like) {
        await likePlaylist(info.id, info.platform, info.name, info.cover, info.creator);
      } else {
        await unlikePlaylist(info.id, info.platform);
      }
      await updateUserLikePlaylist();
      // 更新歌单
      window.$message.success((like ? "收藏" : "取消收藏") + "歌单成功");
    } catch {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌单失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 收藏/取消收藏歌手
export const toLikeArtist = debounce(
  async (info: SingerInfo, like: boolean) => {
    if (!info || !info.id || !info.platform) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }
    try {
      if (like) {
        await likeSinger(info.id, info.platform, info.name, info.cover);
      } else {
        await unlikeSinger(info.id, info.platform);
      }
      await updateUserLikeArtists();
      // 更新歌单
      window.$message.success((like ? "收藏" : "取消收藏") + "歌手成功");
    } catch {
      window.$message.success((like ? "收藏" : "取消收藏") + "歌手失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

// 喜欢取消喜欢专辑
export const toLikeAlbum = debounce(
  async (info: AlbumInfo, like: boolean) => {
    if (!info || !info.id || !info.platform) return;
    if (!isLogin()) {
      window.$message.warning("请登录后使用");
      return;
    }

    try {
      if (like) {
        await likeAlbum(info.id, info.platform, info.name, info.cover, info.singers);
      } else {
        await unlikeAlbum(info.id, info.platform);
      }
      await updateUserLikeAlbums();
      // 更新歌单
      window.$message.success((like ? "收藏" : "取消收藏") + "专辑成功");
    } catch {
      window.$message.success((like ? "收藏" : "取消收藏") + "专辑失败，请重试");
      return;
    }
  },
  300,
  { leading: true, trailing: false },
);

/**
 * 删除歌曲
 * @param pid 歌单id
 * @param ids 要删除的歌曲id
 */
export const deleteSongs = async (pid: string, ids: IDPlatformInfo[], callback?: () => void) => {
  try {
    window.$dialog.warning({
      title: "删除歌曲",
      content: ids?.length > 1 ? "确定删除这些选中的歌曲吗？" : "确定删除这个歌曲吗？",
      positiveText: "删除",
      negativeText: "取消",
      onPositiveClick: async () => {
        try {
          await deleteSongFromPlaylist(pid, ids);
          if (isFunction(callback)) callback();
          window.$message.success("删除成功");
        } catch {
          window.$message.error("删除歌曲失败，请重试");
        }
      },
    });
  } catch (error) {
    console.error("❌ Error deleting songs:", error);
    throw error;
  }
};
