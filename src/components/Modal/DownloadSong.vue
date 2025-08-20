<template>
  <div class="download-song">
    <n-collapse-transition :show="!song">
      <n-text class="loading">
        {{ t("modal.loading_song_info") }}
      </n-text>
    </n-collapse-transition>
    <n-collapse-transition :show="!!song">
      <n-alert type="warning" :title="t('modal.please_know')" closable>
        {{ t("modal.song_download_warning") }}
      </n-alert>
      <SongDataCard :data="song" />
      <n-collapse :default-expanded-names="['level', 'path']" arrow-placement="right">
        <n-collapse-item :title="t('common.song_quality')" name="level">
          <!-- 音质选择 -->
          <n-radio-group v-model:value="songLevelChosen" name="level">
            <n-flex>
              <n-radio v-for="(item, index) in song.links" :key="index" :value="item.name">
                <n-flex>
                  <n-text class="name">
                    {{ item.name }}
                  </n-text>
                  <!-- 文件预估大小 -->
                  <n-text v-if="Number(item.size) > 0" depth="3">
                    {{ formatFileSize(Number(item.size) || 0) }}
                  </n-text>
                </n-flex>
              </n-radio>
            </n-flex>
          </n-radio-group>
        </n-collapse-item>
        <n-collapse-item v-if="isElectron" :title="t('modal.download_path')" name="path">
          <n-input-group>
            <n-input :value="downloadPath || t('modal.download_path_not_configured')" disabled>
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
              {{ t("modal.more_setting") }}
            </n-button>
          </n-input-group>
        </n-collapse-item>
      </n-collapse>
    </n-collapse-transition>
    <n-flex class="menu" justify="end">
      <n-button strong secondary @click="emit('close')">
        {{ t("common.cancel") }}
      </n-button>
      <n-button :loading="loading" type="primary" @click="download">
        {{ t("common.download_song") }}
      </n-button>
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
import { romaSeparator, transSeparator, removeWordLyric } from "@/utils/lyric";
import { getSizeCover } from "@/utils/format";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps<{ song: SongInfo }>();
const emit = defineEmits<{ close: [] }>();

const settingStore = useSettingStore();

// 歌曲数据
// const songData = ref<SongInfo>(props.song);

// 下载数据
const loading = ref<boolean>(false);
const downloadPath = ref<string>(settingStore.downloadPath);
const songLevelChosen = ref<string>("320mp3");

if (!props.song.links?.find((item) => item.name === songLevelChosen.value)) {
  songLevelChosen.value = props.song.links?.at(-1)?.name || "";
}
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

    const link = props.song.links?.find((item) => item.name === songLevelChosen.value);
    if (!link) return;

    const result = await songUrl(props.song.id, props.song.platform, link.quality, link.format);
    if (!result.url) {
      window.$message.error(result.message || t("message.get_url_fail"));
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
    const songName = player.getPlayerInfo(props.song) || "未知歌曲";

    const format = result.format?.toLowerCase() || link.format.toLowerCase();
    // 区分设备下载
    if (isElectron) {
      await electronDownload(result.url, songName, format);
    } else {
      saveAs(result.url, `${songName}.${format || "mp3"}`);
    }
    emit("close");
    window.$message.success(t("message.song_download_success"));
  } catch (error) {
    console.error("Error downloading song:", error);
    window.$message.error(t("message.song_download_fail"));
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
      downloadLyricTran && lyricResult?.trans
        ? [transSeparator, removeWordLyric(lyricResult?.trans)].join("\n")
        : "",
      downloadLyricRoma && lyricResult?.roma
        ? [romaSeparator, removeWordLyric(lyricResult?.roma)].join("\n")
        : "",
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
  if (!isSuccess) throw new Error(t("message.song_download_fail"));
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
