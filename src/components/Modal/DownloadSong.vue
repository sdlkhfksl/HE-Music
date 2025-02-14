<template>
  <div class="download-song">
    <n-collapse-transition :show="!song">
      <n-text class="loading"> 正在加载歌曲信息... </n-text>
    </n-collapse-transition>
    <n-collapse-transition :show="!!song">
      <n-alert type="warning" title="请知悉" closable>
        {{ "本资源仅用于音乐学习和交流，禁止用于商业用途，请下载后于24小时内删除。" }}
      </n-alert>
      <SongDataCard :data="song" />
      <n-collapse :default-expanded-names="['level', 'path']" arrow-placement="right">
        <n-collapse-item title="音质选择" name="level">
          <!-- 音质选择 -->
          <n-radio-group v-model:value="songLevelChoosed" name="level">
            <n-flex>
              <n-radio v-for="(item, index) in song.links" :key="index" :value="item.name">
                <n-flex>
                  <n-text class="name">{{ item.name }}</n-text>
                  <!-- 文件预估大小 -->
                  <n-text depth="3">{{ formatFileSize(Number(item.size) || 0) }}</n-text>
                </n-flex>
              </n-radio>
            </n-flex>
          </n-radio-group>
        </n-collapse-item>
        <n-collapse-item v-if="isElectron" title="本次下载路径" name="path">
          <n-input-group>
            <n-input :value="downloadPath || '未配置下载目录'" disabled>
              <template #prefix>
                <SvgIcon name="Folder" />
              </template>
            </n-input>
            <n-button type="primary" strong secondary @click="changeDownloadPath">
              <template #icon>
                <SvgIcon name="Folder" />
              </template>
            </n-button>
            <n-button type="primary" strong secondary @click="openSetting('local')">
              <template #icon>
                <SvgIcon name="Settings" />
              </template>
              更多设置
            </n-button>
          </n-input-group>
        </n-collapse-item>
      </n-collapse>
    </n-collapse-transition>
    <n-flex class="menu" justify="end">
      <n-button strong secondary @click="emit('close')"> 取消 </n-button>
      <n-button :loading="loading" type="primary" @click="download"> 下载歌曲 </n-button>
    </n-flex>
  </div>
</template>

<script setup lang="ts">
import { songLyric, songUrl } from "@/api/song";
import { useSettingStore } from "@/stores";
import { cloneDeep } from "lodash-es";
import { formatFileSize, isElectron } from "@/utils/helper";
import { openSetting } from "@/utils/modal";
import { saveAs } from "file-saver";
import player from "@/utils/player";
import { SongInfo } from "@/types/main.hemusic";
import { removeWordLyric } from "@/utils/lyric";
import { getSizeCover } from "@/utils/format";

const props = defineProps<{ song: SongInfo }>();
const emit = defineEmits<{ close: [] }>();

const settingStore = useSettingStore();

// 歌曲数据
// const songData = ref<SongInfo>(props.song);

// 下载数据
const loading = ref<boolean>(false);
const downloadPath = ref<string>(settingStore.downloadPath);
const songLevelChoosed = ref<string>("320mp3");

// 获取歌曲详情
const getSongDetail = async (): Promise<any> => {
  // if (!props.id) return;
  // const result = await songDetail(props.id);
  // songData.value = formatSongsList(result.songs)[0];
  // // 获取音质信息
  // const quality = await songQuality(props.id);
  // console.log(quality);
};

// 更改下载路径
const changeDownloadPath = async () => {
  const path = await window.electron.ipcRenderer.invoke("choose-path");
  if (path) downloadPath.value = path;
};

// 下载歌曲
const download = async () => {
  if (!props.song) return;
  loading.value = true;
  if (settingStore.downloadPath) downloadPath.value = settingStore.downloadPath;
  try {
    // 获取下载链接

    const link = props.song.links?.find((item) => item.name === songLevelChoosed.value);
    if (!link) return;

    const result = await songUrl(props.song.id, props.song.platform, link.quality, link.format);
    if (!result.url) {
      window.$message.error(result.message || "获取下载链接失败，请重试");
      return;
    }
    // 校验下载路径
    if (downloadPath.value === "" && isElectron) {
      window.$notification.warning({
        title: "缺少配置",
        description: "请前往设置页配置默认下载目录",
        duration: 5000,
      });
      return;
    }
    // 下载相关数据
    const songName = player.getPlayerInfo(props.song) || "未知曲目";
    // 区分设备下载
    if (isElectron) {
      await electronDownload(result.url, songName, link.format.toLowerCase());
    } else {
      saveAs(result.url, `${songName}.${link.format.toLowerCase() || "mp3"}`);
    }
    emit("close");
    window.$message.success("歌曲下载成功");
  } catch (error) {
    console.error("Error downloading song:", error);
    window.$message.error("下载歌曲出现错误，请重试");
  } finally {
    loading.value = false;
  }
};

// 客户端下载
const electronDownload = async (url: string, songName: string, fileType: string) => {
  const {
    downloadMeta,
    downloadCover,
    downloadLyric,
    downloadLyricTran,
    downloadLyricRoma,
    saveMetaFile,
  } = settingStore;
  // 获取歌词
  let lyric = "";
  if (downloadLyric) {
    const lyricResult = await songLyric(props.song.id, props.song.platform);
    lyric = [
      removeWordLyric(lyricResult?.lyric) || "",
      downloadLyricTran ? removeWordLyric(lyricResult?.trans) : "",
      downloadLyricRoma ? removeWordLyric(lyricResult?.spelling) : "",
    ]
      .filter((item) => !!item)
      .join("\n\n");
  }
  // 下载歌曲
  const config = {
    fileName: songName.replace(/[/:*?"<>|]/g, "&"),
    fileType,
    path: downloadPath.value,
    downloadMeta,
    downloadCover,
    downloadLyric,
    saveMetaFile,
    songData: { ...cloneDeep(props.song), cover: getSizeCover(props.song, -1) },
    lyric,
  };
  // 开始下载
  const isSuccess = await window.electron.ipcRenderer.invoke("download-file", url, config);
  if (!isSuccess) throw new Error("下载歌曲出现错误，请重试");
};

onMounted(() => getSongDetail());
</script>

<style lang="scss" scoped>
.download-song {
  .n-alert {
    margin-bottom: 20px;
  }
  .n-collapse {
    margin-top: 20px;
  }
  .menu {
    margin-top: 20px;
  }
}
</style>
