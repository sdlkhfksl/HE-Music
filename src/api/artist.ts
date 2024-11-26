import request, { requestHemusic } from "@/utils/request";

/**
 * 歌手分类列表
 * @param {number} type - 歌手类型（-1:全部 1:男歌手 2:女歌手 3:乐队）
 * @param {number} area - 歌手区域（-1:全部 7:华语 96:欧美 8:日本 16:韩国 0:其他）
 * @param {number|string} initial - 首字母索引查找参数
 * @param {number} [offset=0] - 偏移数量，默认 0
 * @param {number} [limit=50] - 返回数量，默认 50
 */
export const artistTypeList = (
  type: number = -1,
  area: number = -1,
  initial: number | string = -1,
  offset: number = 0,
  limit: number = 50,
) => {
  return request({
    url: "/artist/list",
    params: {
      type,
      area,
      initial,
      offset,
      limit,
    },
  });
};

/**
 * 获取歌手详情
 * @param  id - 歌手id
 * @param platform
 */
export const artistDetail = (id: string, platform: string) => {
  return requestHemusic({
    url: "/v1/singer",
    params: { id, platform },
  });
};

/**
 * 获取歌手全部歌曲
 * @param {number} id - 歌手id
 * @param platform
 * @param page_index
 * @param page_size
 */
export const artistAllSongs = (
  id: string,
  platform: string,
  page_index: number = 1,
  page_size: number = 50,
) => {
  return requestHemusic({
    url: "/v1/singer/song",
    params: { id, platform, page_index, page_size },
  });
};

/**
 * 获取歌手专辑
 * @param {number} id - 歌手id
 * @param platform
 * @param page_index
 * @param page_size
 */
export const artistAblums = (
  id: string,
  platform: string,
  page_index: number = 1,
  page_size: number = 50,
) => {
  return requestHemusic({
    url: "/v1/singer/album",
    params: { id, platform, page_index, page_size },
  });
};

/**
 * 获取歌手视频
 * @param {number} id - 歌手id
 * @param platform
 * @param page_index
 * @param page_size
 */
export const artistVideos = (
  id: string,
  platform: string,
  page_index: number = 1,
  page_size: number = 50,
) => {
  return requestHemusic({
    url: "/v1/singer/mv",
    params: { id, platform, page_index, page_size },
  });
};
