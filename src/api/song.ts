import request, { API_URL, requestHemusic } from "@/utils/request";

// 获取歌曲 URL
export const songUrl = (
  id: string,
  platform: string,
  quality: number = 320,
  format: string = "mp3",
) => {
  return requestHemusic({
    url: "/v1/song/url",
    params: {
      id,
      platform,
      quality,
      format,
    },
  });
};

// 获取解锁歌曲 URL
export const unlockSongUrl = (id: string, keyword: string, server: "netease" | "kuwo") => {
  const params = server === "netease" ? { id: Number(id) } : { keyword };
  return request({
    baseURL: "/api/unblock",
    url: `/${server}`,
    params,
  });
};

// 获取歌曲歌词
export const songLyric = (id, platform: string) => {
  return requestHemusic({
    url: "/v1/song/lyric",
    params: {
      id,
      platform,
    },
  });
};

// 获取歌曲歌词
export const neteaseSongLyric = (id: number) => {
  return request({
    url: "/lyric/new",
    params: {
      id,
    },
  });
};

/**
 * 本地歌曲文件匹配
 * @param {string} title - 文件的标题信息，是文件属性里的标题属性，并非文件名
 * @param {string} album - 文件的专辑信息
 * @param {string} artist - 文件的艺术家信息
 * @param {number} duration - 文件的时长，单位为秒
 * @param {string} md5 - 文件的 md5
 */

export const matchSong = (
  title: string,
  artist: string,
  album: string,
  duration: number,
  md5: string,
) => {
  return request({
    url: "/search/match",
    params: { title, artist, album, duration, md5 },
  });
};

/**
 * 歌曲动态封面
 * @param {number} id - 歌曲 id
 */

export const songDynamicCover = (id: number) => {
  return request({
    url: "/song/dynamic/cover",
    params: { id },
  });
};

export const newSongTabs = (platform: string) => {
  return requestHemusic({
    url: "/v1/song/new/tab",
    params: { platform },
  });
};
export const newSongs = (
  platform: string,
  tab_id: string,
  page_index = 1,
  page_size: number = 30,
) => {
  return requestHemusic({
    url: "/v1/song/new",
    params: { platform, tab_id, page_size, page_index },
  });
};
export const songInfo = (platform: string, id: string) => {
  return requestHemusic({
    url: "/v1/song",
    params: { ids: id, platform },
  });
};

export const getCoverUrlStr = (
  platform: string,
  id: string,
  quality = 300,
  redirect = true,
  token = "",
) =>
  `${API_URL}/v1/song/cover?${new URLSearchParams({
    id,
    platform,
    quality: quality.toString(),
    redirect: redirect.toString(),
    token,
  }).toString()}`;
