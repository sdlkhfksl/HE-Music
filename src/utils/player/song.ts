import { songUrl, unlockSongUrl } from "@/api/song";
import { useDataStore, useMusicStore, useStatusStore } from "@/stores";
import { getCoverColorData } from "../color";
import { Link, SongInfo } from "@/types/main.hemusic";
import { t } from "@/i18n";

/**
 * 获取当前播放歌曲
 * @returns 当前播放歌曲
 */
export const getPlaySongData = (): SongInfo | null => {
  const dataStore = useDataStore();
  const musicStore = useMusicStore();
  const statusStore = useStatusStore();
  // 若为私人FM
  if (statusStore.radioMode) {
    return musicStore.radioSong;
  }
  // 播放列表
  const playlist = dataStore.playList;
  if (!playlist.length) return null;
  return playlist[statusStore.playIndex];
};

/**
 * 获取播放信息
 * @param song 歌曲
 * @param sep 分隔符
 * @returns 播放信息
 */
export const getPlayerInfo = (song?: SongInfo, sep: string = "/"): string | null => {
  const playSongData = song || getPlaySongData();
  if (!playSongData) return null;
  // 标题
  const title = `${playSongData.name}`;
  // 歌手
  const artist = Array.isArray(playSongData.artists)
    ? playSongData.artists.map((artists: { name: string }) => artists.name).join(sep)
    : String(playSongData?.artists || t("common.unknown_artist"));
  return `${title} - ${artist}`;
};

export const getOnlineUrl = async (
  id: string,
  platform: string,
  link?: Link,
): Promise<string | null> => {
  const res = await songUrl(id, platform, link?.quality, link?.format);
  console.log(`🌐 ${id} music data:`, res);
  const songData = res;
  // 是否有播放地址
  if (!songData || !songData?.url) return null;
  // 返回歌曲地址
  // 都返回 原始地址
  // const url = isElectron ? songData.url : songData.url.replace(/^http:/, "https:");
  return songData.url;
};

/**
 * 获取解锁播放链接
 * @param songData 歌曲数据
 * @returns
 */
export const getUnlockSongUrl = async (songData: SongInfo): Promise<string | null> => {
  try {
    const songId = songData.id;
    const artist = Array.isArray(songData.artists) ? songData.artists[0].name : songData.artists;
    const keyWord = songData.name + "-" + artist;
    if (!songId || !keyWord) return null;

    const servers: any[] = ["bodian", "netease"];

    // 尝试解锁
    const promises = servers.map((server) => unlockSongUrl(songId, keyWord, server));
    const results = await Promise.allSettled(promises);
    // 解析结果
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.code === 200 && result.value.url) {
        return result.value.url;
      }
    }
    return null;
  } catch (error) {
    console.error("Error in getUnlockSongUrl", error);
    return null;
  }
};

/**
 * 获取歌曲封面颜色数据
 * @param coverUrl 歌曲封面地址
 */
export const getCoverColor = async (coverUrl: string) => {
  if (!coverUrl) return;
  const statusStore = useStatusStore();
  // 创建图像元素
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = coverUrl;
  // 图像加载完成
  image.onload = () => {
    try {
      // 获取图片数据
      const coverColorData = getCoverColorData(image);
      if (coverColorData) statusStore.songCoverTheme = coverColorData;
    } catch (e: any) {
      console.error("❌ Error getting cover color data:", e);
    }
    // 移除元素
    image.remove();
  };
};
