<template>
  <div class="batch-list">
    <n-data-table
      :columns="columnsData"
      :data="tableData"
      max-height="60vh"
      virtual-scroll
      @update:checked-row-keys="tableCheck"
    />
    <n-flex class="batch-footer" justify="space-between" align="center">
      <n-text :depth="3" class="count">已选择 {{ checkCount }} 首</n-text>
      <n-flex class="menu">
        <!-- 批量删除 -->
        <n-button
          v-if="playListId"
          :disabled="!checkCount"
          type="error"
          strong
          secondary
          @click="
            deleteSongs(
              playListId,
              checkSongData.map((item) => ({ id: item.id, platform: item.platform })),
            )
          "
        >
          <template #icon>
            <SvgIcon name="Delete" />
          </template>
          删除选中的歌曲
        </n-button>
        <!-- 添加到歌单 -->
        <n-button
          :disabled="!checkCount"
          type="primary"
          strong
          secondary
          @click="openPlaylistAdd(checkSongData, isLocal)"
        >
          <template #icon>
            <SvgIcon name="AddList" />
          </template>
          添加到歌单
        </n-button>
      </n-flex>
    </n-flex>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns, DataTableRowKey } from "naive-ui";
import { isArray, isObject } from "lodash-es";
import { openPlaylistAdd } from "@/utils/modal";
import { deleteSongs } from "@/utils/auth";
import { SongInfo } from "@/types/main.hemusic";

interface DataType {
  key?: number;
  id?: string;
  platform?: string;
  name?: string;
  artists?: string;
  album?: string;
  // 原始数据
  origin?: SongInfo;
}

const props = defineProps<{
  data: SongInfo[];
  isLocal: boolean;
  playListId?: string;
}>();

// 选中数据
const checkCount = ref<number>(0);
const checkSongData = ref<SongInfo[]>([]);

// 表头数据
const columnsData = computed<DataTableColumns<DataType>>(() => [
  {
    type: "selection",
    disabled(row: DataType) {
      return !row.id;
    },
  },
  {
    title: "#",
    key: "key",
    width: 80,
  },
  {
    title: "标题",
    key: "name",
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: "歌手",
    key: "artists",
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: "专辑",
    key: "album",
    ellipsis: {
      tooltip: true,
    },
  },
]);

// 表格数据
const tableData = computed<DataType[]>(() =>
  props.data.map((song, index) => ({
    key: index + 1,
    id: song?.id,
    platform: song?.platform,
    name: song?.name || "未知曲目",
    artists: isArray(song?.singers)
      ? // 拼接歌手
        song?.singers.map((ar: { name: string }) => ar.name).join(" / ")
      : song?.singers || "未知歌手",
    album: isObject(song?.album) ? song?.album.name : song?.album || "未知专辑",
    // 原始数据
    origin: song,
  })),
);

// 表格勾选
const tableCheck = (keys: DataTableRowKey[], rows: DataType[]) => {
  // 更改选中数量
  checkCount.value = keys.length;
  // 更改选中歌曲
  checkSongData.value = rows.map((row) => row.origin).filter((song) => song) as SongInfo[];
};
</script>

<style lang="scss" scoped>
.batch-footer {
  margin-top: 20px;
}
</style>
