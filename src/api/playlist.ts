import { requestHemusic } from "@/utils/request";

// 获取歌单详情
export const playlistDetail = (id: string, platform: string) => {
  return requestHemusic({
    url: "/v1/playlist",
    params: {
      id,
      platform,
    },
  });
};

// 获取歌单分类信息
export const playlistTagList = (platform: string) => {
  return requestHemusic({
    url: `/v1/tag/list`,
    params: {
      platform,
    },
  });
};

// 获取歌单分类信息
export const tagPlaylistList = (
  id: string,
  platform: string,
  page_index: number = 1,
  page_size: number = 30,
  last_id: string = "",
) => {
  return requestHemusic({
    url: `/v1/tag/playlist`,
    params: {
      platform,
      id,
      page_index,
      page_size,
      last_id,
    },
  });
};

/**
 * 获取排行榜数据
 * @param platform
 */
export const getTopList = (platform: string) => {
  return requestHemusic({ url: "/v1/top/list", params: { platform } });
};

/**
 * 获取排行榜数据
 * @param platform
 * @param id
 * @param page_index
 * @param page_size
 * @param last_id
 */
export const topInfo = (
  id: string,
  platform: string,
  page_index: number = 1,
  page_size: number = 100,
  last_id: string = "",
) => {
  return requestHemusic({
    url: "/v1/top",
    params: {
      platform,
      id,
      page_index,
      page_size,
      last_id,
    },
  });
};
