<!-- 歌曲列表 - 右键菜单 -->
<template>
  <n-dropdown
    :x="dropdownX"
    :y="dropdownY"
    :show="dropdownShow"
    :options="dropdownOptions"
    class="song-list-menu"
    placement="bottom-start"
    trigger="manual"
    size="large"
    @select="dropdownShow = false"
    @clickoutside="dropdownShow = false"
  />
</template>

<script setup lang="ts">
import { type DropdownOption, NAlert } from "naive-ui";
import { useDataStore, useLocalStore, usePlatformStore, useStatusStore } from "@/stores";
import { copyData, renderIcon } from "@/utils/helper";
import { openDownloadSong, openPlaylistAdd, openSongInfoEditor } from "@/utils/modal";
import { deleteSongs, isLogin } from "@/utils/auth";
import { usePlayer } from "@/utils/player";
import type { SongInfo } from "@/types/main.hemusic";
import { buildSourceUrl } from "@/api/source";
import { FeatureSupportFlag } from "@/api/platform";
import DownloadManager from "@/utils/downloadManager";
import { useI18n } from "vue-i18n";
import { songEqual } from "@/utils/song";
const { t } = useI18n();

const emit = defineEmits<{ removeSong: [index: SongInfo[]] }>();

const router = useRouter();
const player = usePlayer();
const localStore = useLocalStore();
const statusStore = useStatusStore();
const platformStore = usePlatformStore();
const dataStore = useDataStore();

// 右键菜单数据
const dropdownX = ref<number>(0);
const dropdownY = ref<number>(0);
const dropdownShow = ref<boolean>(false);
const dropdownOptions = ref<DropdownOption[]>([]);

// 开启右键菜单
const openDropdown = (
  e: MouseEvent,
  data: SongInfo[],
  song: SongInfo,
  index: number,
  playlist: {
    id: string;
    platform?: string;
    type?: string;
  } = {
    id: "",
    platform: "",
    type: "",
  },
) => {
  try {
    e.preventDefault();
    dropdownShow.value = false;
    // 当前状态
    const isHasMv = !!song?.mv_id && song.mv_id !== "0";
    const isLocal = !!song?.path;
    const isLoginNormal = isLogin();
    // 是否当前播放
    const isCurrent = statusStore.playIndex === index;
    // 是否为用户歌单
    const isUserPlaylist = !!(playlist?.id && playlist?.type === "user-playlist");
    // 是否正在下载或下载失败
    const isDownloading = dataStore.downloadingSongs.some((item) => songEqual(song, item.song));

    // 生成菜单
    nextTick().then(() => {
      dropdownOptions.value = [
        {
          key: "play",
          label: t("menu.play"),
          props: {
            onClick: () => player.addNextSong(song, true),
          },
          icon: renderIcon("Play", { size: 18 }),
        },
        {
          key: "play-next",
          label: t("menu.play_next"),
          show: !isCurrent && !statusStore.radioMode,
          props: {
            onClick: () => player.addNextSong(song, false),
          },
          icon: renderIcon("PlayNext", { size: 18 }),
        },
        {
          key: "playlist-add",
          label: t("menu.add_to_playlist"),
          props: {
            onClick: () => openPlaylistAdd([song], isLocal),
          },
          icon: renderIcon("AddList", { size: 18 }),
        },
        {
          key: "mv",
          label: t("menu.watch_mv"),
          show: isHasMv,
          props: {
            onClick: () =>
              router.push({ name: "video", query: { id: song.mv_id, platform: song.platform } }),
          },
          icon: renderIcon("Video", { size: 18 }),
        },
        {
          key: "line-1",
          type: "divider",
        },
        {
          key: "more",
          label: t("menu.more_operation"),
          icon: renderIcon("Menu", { size: 18 }),
          children: [
            {
              key: "code-name",
              label: t("menu.copy_song_name"),
              props: {
                onClick: () => copyData(song.name),
              },
              icon: renderIcon("Copy", { size: 18 }),
            },
            {
              key: "code-id",
              label: t("menu.copy_song_id"),
              show: !isLocal,
              props: {
                onClick: () => copyData(song.id),
              },
              icon: renderIcon("Copy", { size: 18 }),
            },
            {
              key: "share",
              label: t("menu.copy_share_link"),
              show:
                !isLocal &&
                platformStore.isFeatureSupport(song.platform, FeatureSupportFlag.BuildSourceUrl),
              props: {
                onClick: async () => {
                  const { url } = await buildSourceUrl(song.platform, song.id, "song");
                  await copyData(url, t("menu.share_link_copied"));
                },
              },
              icon: renderIcon("Share", { size: 18 }),
            },
            {
              key: "line-2",
              type: "divider",
              show: isLocal,
            },
            {
              key: "meta-edit",
              label: t("menu.music_tag_edit"),
              show: isLocal,
              props: {
                onClick: () => {
                  if (song.path) openSongInfoEditor(song);
                },
              },
              icon: renderIcon("EditNote", { size: 20 }),
            },
            {
              key: "line-1-1",
              type: "divider",
            },
            {
              key: "source",
              label: platformStore.getPlatformInfo(song.platform)?.name || song.platform,

              show: !isLocal,
              disabled: true,
              icon: renderIcon("Source"),
            },
          ],
        },
        {
          key: "line-3",
          type: "divider",
        },
        {
          key: "delete",
          label: t("menu.delete_from_playlist"),
          show: isUserPlaylist && isLoginNormal,
          props: {
            onClick: () =>
              deleteSongs(playlist.id, [{ id: song.id, platform: song.platform }], () =>
                emit("removeSong", [song]),
              ),
          },
          icon: renderIcon("Delete"),
        },
        {
          key: "delete-file",
          label: t("menu.delete_file"),
          show: isLocal && !isCurrent,
          props: {
            onClick: () => deleteLocalSong(song, data, index),
          },
          icon: renderIcon("Delete"),
        },
        {
          key: "open-folder",
          label: t("menu.open_folder"),
          show: isLocal,
          props: {
            onClick: () => window.electron.ipcRenderer.send("open-folder", song.path),
          },
          icon: renderIcon("SnippetFolder"),
        },
        {
          key: "search",
          label: t("menu.same_name_search"),
          props: {
            onClick: () => router.push({ name: "search", query: { keyword: song.name } }),
          },
          icon: renderIcon("Search"),
        },
        {
          key: "download",
          label: t("common.download_song"),
          show: !isLocal && !isDownloading,
          props: { onClick: () => openDownloadSong(song) },
          icon: renderIcon("Download"),
        },
        {
          key: "retry-download",
          label: t("download.retry"),
          show: isDownloading,
          props: { onClick: () => DownloadManager.retryDownload(song) },
          icon: renderIcon("Refresh"),
        },
      ];
      // 显示菜单
      dropdownX.value = e.clientX;
      dropdownY.value = e.clientY;
      dropdownShow.value = true;
    });
  } catch (error) {
    console.error("右键菜单出现异常：", error);
    window.$message.error(t("message.right_click_menu_error"));
  }
};

// 删除歌曲
const deleteLocalSong = (song: SongInfo, data: SongInfo[], index: number) => {
  if (!song.path) return;
  window.$dialog.warning({
    title: t("common.confirm_delete"),
    content: () =>
      h("div", { style: { marginTop: "20px" } }, [
        h(NAlert, { showIcon: false }, { default: () => song.path }),
        h("div", { style: { marginTop: "20px" } }, [
          t("menu.delete_file_confirm"),
          h("strong", null, song.name),
          t("menu.delete_file_confirm_tip"),
        ]),
      ]),
    positiveText: t("common.delete"),
    negativeText: t("common.cancel"),
    onPositiveClick: async () => {
      const result = await window.electron.ipcRenderer.invoke("delete-file", song.path);
      if (result) {
        data.splice(index, 1);
        localStore.deleteLocalSong(index);
        player.removeSongIndex(index);
        window.$message.success(`${song.name} ${t("menu.delete_file_success")}`);
      } else {
        window.$message.error(`${song.name} ${t("menu.delete_file_fail_and_retry")}`);
      }
    },
  });
};

defineExpose({ openDropdown });
</script>

<style lang="scss">
.delete-mata {
  display: flex;
}
</style>
