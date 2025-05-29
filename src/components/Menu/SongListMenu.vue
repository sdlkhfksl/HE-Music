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
  >
  </n-dropdown>
</template>

<script setup lang="ts">
import { type DropdownOption, NAlert } from "naive-ui";
import { useLocalStore, usePlatformStore, useStatusStore } from "@/stores";
import { copyData, renderIcon } from "@/utils/helper";
import { openDownloadSong, openPlaylistAdd, openSongInfoEditor } from "@/utils/modal";
import { deleteSongs, isLogin } from "@/utils/auth";
import player from "@/utils/player";
import { SongInfo } from "@/types/main.hemusic";
import { buildSourceUrl } from "@/api/source";
import { FeatureSupportFlag } from "@/api/platform";

const emit = defineEmits<{ removeSong: [index: SongInfo[]] }>();

const router = useRouter();
const localStore = useLocalStore();
const statusStore = useStatusStore();
const platformStore = usePlatformStore();

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
    console.log("menu", playlist.id, playlist.type, isUserPlaylist);
    // 生成菜单
    nextTick().then(() => {
      dropdownOptions.value = [
        {
          key: "play",
          label: "立即播放",
          props: {
            onClick: () => player.addNextSong(song, true),
          },
          icon: renderIcon("Play", { size: 18 }),
        },
        {
          key: "play-next",
          label: "下一首播放",
          show: !isCurrent,
          props: {
            onClick: () => player.addNextSong(song, false),
          },
          icon: renderIcon("PlayNext", { size: 18 }),
        },
        {
          key: "playlist-add",
          label: "添加到歌单",
          props: {
            onClick: () => openPlaylistAdd([song], isLocal),
          },
          icon: renderIcon("AddList", { size: 18 }),
        },
        {
          key: "mv",
          label: "观看 MV",
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
          label: "更多操作",
          icon: renderIcon("Menu", { size: 18 }),
          children: [
            {
              key: "code-name",
              label: `复制歌曲名称`,
              props: {
                onClick: () => copyData(song.name),
              },
              icon: renderIcon("Copy", { size: 18 }),
            },
            {
              key: "code-id",
              label: `复制歌曲ID`,
              show: !isLocal,
              props: {
                onClick: () => copyData(song.id),
              },
              icon: renderIcon("Copy", { size: 18 }),
            },
            {
              key: "share",
              label: `分享歌曲链接`,
              show:
                !isLocal &&
                platformStore.isFeatureSupport(song.platform, FeatureSupportFlag.BuildSourceUrl),
              props: {
                onClick: async () => {
                  const { url } = await buildSourceUrl(song.platform, song.id, "song");
                  await copyData(url, "已复制分享链接到剪切板");
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
              label: "音乐标签编辑",
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
          label: "从歌单中删除",
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
          key: "delete",
          label: "从本地磁盘中删除",
          show: isLocal && !isCurrent,
          props: {
            onClick: () => deleteLocalSong(song, data, index),
          },
          icon: renderIcon("Delete"),
        },
        {
          key: "open-folder",
          label: "打开歌曲所在目录",
          show: isLocal,
          props: {
            onClick: () => window.electron.ipcRenderer.send("open-folder", song.path),
          },
          icon: renderIcon("SnippetFolder"),
        },
        {
          key: "search",
          label: "同名搜索",
          props: {
            onClick: () => router.push({ name: "search", query: { keyword: song.name } }),
          },
          icon: renderIcon("Search"),
        },
        {
          key: "download",
          label: "下载歌曲",
          show: !isLocal,
          props: { onClick: () => openDownloadSong(song) },
          icon: renderIcon("Download"),
        },
      ];
      // 显示菜单
      dropdownX.value = e.clientX;
      dropdownY.value = e.clientY;
      dropdownShow.value = true;
    });
  } catch (error) {
    console.error("右键菜单出现异常：", error);
    window.$message.error("右键菜单出现异常");
  }
};

// 删除歌曲
const deleteLocalSong = (song: SongInfo, data: SongInfo[], index: number) => {
  if (!song.path) return;
  window.$dialog.warning({
    title: "确认删除",
    content: () =>
      h("div", { style: { marginTop: "20px" } }, [
        h(NAlert, { showIcon: false }, { default: () => song.path }),
        h("div", { style: { marginTop: "20px" } }, [
          `确认从本地磁盘中删除 `,
          h("strong", null, song.name),
          `？该操作无法撤销！`,
        ]),
      ]),
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      const result = await window.electron.ipcRenderer.invoke("delete-file", song.path);
      if (result) {
        data.splice(index, 1);
        localStore.deleteLocalSong(index);
        player.removeSongIndex(index);
        window.$message.success(`${song.name} 删除成功`);
      } else {
        window.$message.error(`${song.name} 删除失败，请重试`);
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
