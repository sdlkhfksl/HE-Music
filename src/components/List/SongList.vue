<!-- 歌曲列表 - 虚拟列表 -->
<!-- vue-virt-list https://github.com/keno-lee/vue-virt-list -->
<template>
  <Transition name="fade" mode="out-in">
    <div
      v-if="!isEmpty(listData)"
      ref="songListRef"
      :class="[
        'song-list',
        {
          'hidden-scrollbar': hiddenScrollbar,
        },
      ]"
    >
      <Transition name="fade" mode="out-in">
        <VirtList
          ref="listRef"
          :key="listKey"
          :list="listData"
          :min-size="94"
          :buffer="2"
          :offset="offset"
          :style="{ height: height === 'auto' ? 'auto' : `${height || songListHeight}px` }"
          item-key="id"
          @scroll="onScroll"
          @to-bottom="onToBottom"
        >
          <!-- 悬浮顶栏 -->
          <template v-if="showHeader" #stickyHeader>
            <div class="list-header song-card">
              <n-text class="num"> # </n-text>
              <n-dropdown
                v-if="!disabledSort"
                :options="sortMenuOptions"
                trigger="click"
                placement="bottom-start"
                @select="sortSelect"
              >
                <div class="title has-sort">
                  <n-text>{{ t("common.title") }}</n-text>
                  <n-text v-if="statusStore.listSort !== 'default'" class="sort" depth="3">
                    {{ t(`sort.${snakeCase(statusStore.listSort)}`) }}
                  </n-text>
                </div>
              </n-dropdown>
              <n-text v-else class="title">
                {{ t("common.title") }}
              </n-text>
              <n-text v-if="!hiddenAlbum" class="album">
                {{ t("common.album") }}
              </n-text>
              <n-text class="actions" />
              <n-text class="meta">
                {{ t("common.duration") }}
              </n-text>
              <n-text v-if="!hiddenSize" class="meta">
                {{ t("common.size") }}
              </n-text>
            </div>
          </template>
          <!-- 主内容 -->
          <template #default="{ itemData, index }">
            <SongCard
              :song="itemData"
              :index="index"
              :hidden-cover="hiddenCover"
              :hidden-album="hiddenAlbum"
              :hidden-size="hiddenSize"
              @dblclick.stop="
                doubleClickAction === 'add'
                  ? player.addNextSong(itemData, true)
                  : player.updatePlayList(listData, itemData, playlist)
              "
              @contextmenu.stop="
                songListMenuRef?.openDropdown($event, listData, itemData, index, playlist)
              "
              @click-more="
                songListMenuRef?.openDropdown($event, listData, itemData, index, playlist)
              "
            />
          </template>
          <!-- 加载更多 -->
          <template #footer>
            <div v-if="showFooter" class="load-more">
              <n-flex v-if="loadMore && loading">
                <n-spin size="small" />
                <n-text>{{ loadingText || t("common.effort_loading") }}</n-text>
              </n-flex>
              <n-divider v-else dashed> {{ t("common.no_more_data") }} ~ </n-divider>
            </div>
          </template>
        </VirtList>
      </Transition>
      <!-- 右键菜单 -->
      <SongListMenu ref="songListMenuRef" @remove-song="removeSong" />
      <!-- 列表操作 -->
      <Teleport to="body">
        <Transition name="fade" mode="out-in">
          <n-float-button-group v-if="floatToolShow" class="list-menu">
            <Transition name="fade" mode="out-in">
              <n-float-button v-if="scrollTop > 100" width="42" @click="listRef?.scrollToTop()">
                <SvgIcon :size="22" name="Up" />
              </n-float-button>
            </Transition>
            <n-float-button
              v-if="hasPlaySong >= 0"
              width="42"
              @click="listRef?.scrollToIndex(hasPlaySong)"
            >
              <SvgIcon :size="22" name="Location" />
            </n-float-button>
          </n-float-button-group>
        </Transition>
      </Teleport>
    </div>
    <!-- 列表加载 - 骨架屏 -->
    <div v-else-if="loading" class="song-list loading">
      <n-skeleton :repeat="10" text />
    </div>
    <!-- 空列表 -->
    <n-empty v-else :description="t('common.list_empty')" size="large" class="song-list empty" />
  </Transition>
</template>

<script setup lang="ts">
import type { DropdownOption } from "naive-ui";
import type { SortType } from "@/types/main";
import { useMusicStore, useStatusStore } from "@/stores";
import { VirtList } from "vue-virt-list";
import { entries, isEmpty, snakeCase } from "lodash-es";
import { sortOptions } from "@/utils/meta";
import { renderIcon } from "@/utils/helper";
import SongListMenu from "@/components/Menu/SongListMenu.vue";
import { usePlayer } from "@/utils/player";
import type { SongInfo } from "@/types/main.hemusic";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    // 列表数据
    data: SongInfo[];
    // 列表类型
    type?: "song";
    // 列表高度
    height?: number | "auto"; // px
    // 是否加载
    loading?: boolean;
    // 加载更多
    loadMore?: boolean;
    loadingText?: string;
    // 隐藏元素
    hiddenAlbum?: boolean;
    hiddenCover?: boolean;
    // 隐藏滚动条
    hiddenScrollbar?: boolean;
    // 禁用排序
    disabledSort?: boolean;
    playlist?: {
      id: string;
      platform?: string;
      type?: string;
    };
    // 显示底部
    showFooter?: boolean;
    showHeader?: boolean;
    hiddenSize?: boolean;
    // 双击播放操作
    doubleClickAction?: "all" | "add";
    keepOffset?: boolean;
  }>(),
  {
    type: "song",
    loadingText: "",
    showFooter: true,
    hiddenSize: true,
    showHeader: true,
    keepOffset: true,
  },
);

const emit = defineEmits<{
  // 触底
  reachBottom: [e: Event];
  // 滚动
  scroll: [e: Event];
  // 删除歌曲
  removeSong: [info: SongInfo[]];
}>();

const player = usePlayer();
const musicStore = useMusicStore();
const statusStore = useStatusStore();

// 列表状态
const offset = ref<number>(0);
const scrollTop = ref<number>(0);

// 列表元素
const listRef = ref<InstanceType<typeof VirtList> | null>(null);
const songListRef = ref<HTMLElement | null>(null);

// 悬浮工具
const floatToolShow = ref<boolean>(true);

// 右键菜单
const songListMenuRef = ref<InstanceType<typeof SongListMenu> | null>(null);

// 列表数据
const listData = computed<SongInfo[]>(() => {
  if (props.disabledSort) return props.data;
  // 创建副本用于排序（避免修改原数组）
  const data = [...props.data];
  // 排序
  switch (statusStore.listSort) {
    case "titleAZ":
      return data.sort((a, b) => a.name.localeCompare(b.name));
    case "titleZA":
      return data.sort((a, b) => b.name.localeCompare(a.name));
    case "arAZ":
      return data.sort((a, b) => {
        const artistA = Array.isArray(a.artists) ? a.artists[0].name : a.artists;
        const artistB = Array.isArray(b.artists) ? b.artists[0].name : b.artists;
        return artistA?.localeCompare(artistB || "") || 0;
      });
    case "arZA":
      return data.sort((a, b) => {
        const artistA = Array.isArray(a.artists) ? a.artists[0].name : a.artists;
        const artistB = Array.isArray(b.artists) ? b.artists[0].name : b.artists;
        return artistB?.localeCompare(artistA || "") || 0;
      });
    case "timeDown":
      return data.sort((a, b) => b.duration - a.duration);
    case "timeUp":
      return data.sort((a, b) => a.duration - b.duration);
    // case "dateDown":
    //   return data.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0));
    // case "dateUp":
    //   return data.sort((a, b) => (a.updateTime || 0) - (b.updateTime || 0));
    default:
      return data;
  }
});

// 虚拟列表 key
const listKey = computed(() => {
  // 其他列表长度（检测增删操作）
  return listData?.[0]?.id;
});

// 列表是否具有播放歌曲
const hasPlaySong = computed(() => {
  return listData.value.findIndex(
    (item) => item.id === musicStore.playSong.id && item.platform === musicStore.playSong.platform,
  );
});

// 列表元素高度
const { height: songListHeight, stop: stopCalcHeight } = useElementSize(songListRef);

// 列表排序菜单
const sortMenuOptions = computed<DropdownOption[]>(() =>
  entries(sortOptions).map(([key, { show, icon }]) => ({
    key,
    label: t(`sort.${snakeCase(key)}`),
    show: show === "all" ? true : show === props.type,
    icon: renderIcon(icon),
  })),
);

// 列表滚动
const onScroll = (e: Event) => {
  emit("scroll", e);
  scrollTop.value = (e.target as HTMLElement).scrollTop;
};

// 列表触底
const onToBottom = (e: Event) => {
  if (props.loading) return;
  emit("reachBottom", e);
};

// 排序更改
const sortSelect = (key: SortType) => {
  statusStore.listSort = key;
  // 更新列表
  if (
    musicStore.isPlayingPlaylist(
      props.playlist?.id || "",
      props.playlist?.platform || "",
      props.playlist?.type || "",
    )
  ) {
    player.updatePlayList(listData.value, musicStore.playSong, props.playlist, {
      showTip: false,
      play: false,
      scrobble: false,
    });
  }
  // 滚动到顶部
  listRef.value?.scrollToIndex(hasPlaySong.value || 0);
};

// 删除指定索引
const removeSong = (song: SongInfo[]) => emit("removeSong", song);

// keep-alive 处理
onBeforeRouteLeave(() => {
  offset.value = listRef.value?.getOffset() || 0;
  floatToolShow.value = false;
});

onActivated(() => {
  floatToolShow.value = true;
  if (props.height === "auto") stopCalcHeight();
  if (!props.keepOffset) offset.value = 0;
  if (offset.value > 0) listRef.value?.scrollToOffset(offset.value);
});

onBeforeUnmount(() => {
  stopCalcHeight();
  floatToolShow.value = false;
});
</script>

<style lang="scss" scoped>
.song-list {
  height: 100%;
  width: 100%;
  border-radius: 12px 0 0 12px;
  overflow: hidden;
  .song-card {
    padding-bottom: 12px;
    overflow-x: hidden; /* 防止水平滚动 */
  }
  // 悬浮顶栏
  .list-header {
    width: 100%;
    //height:50px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 5px 12px;
    // margin-right: 4px;
    border: 1px solid transparent;
    background-color: var(--background-hex);
    .n-text {
      opacity: 0.6;
    }
    .num {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      min-width: 40px;
      font-weight: bold;
      margin-right: 12px;
      @media (max-width: 768px) {
        display: none;
      }
    }
    .title {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      padding: 4px 20px 4px 0;
      cursor: pointer;
      .sort {
        margin-left: 6px;
        &::after {
          content: " )";
        }
        &::before {
          content: "( ";
        }
      }
      &.has-sort {
        &::after {
          content: "";
          position: absolute;
          opacity: 0;
          top: 0;
          left: -8px;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background-color: rgba(var(--primary), 0.08);
          transition: opacity 0.3s;
        }
        &:hover {
          &::after {
            opacity: 1;
          }
        }
      }
    }
    .album {
      flex: 1;
      padding-right: 20px;
      @media (max-width: 768px) {
        display: none;
      }
    }
    .actions {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
    }
    .meta {
      width: 50px;
      text-align: center;
      &.size {
        width: 60px;
      }
      &.date {
        width: 80px;
      }
      @media (max-width: 768px) {
        display: none;
      }
    }
  }
  // 滚动条
  .virt-list__client {
    width: 100%;
    overflow-x: hidden !important; /* 禁用水平滚动 */
    transition:
      height 0.3s,
      width 0.3s,
      opacity 0.3s;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
      width: 6px;
      background-color: transparent;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(var(--primary), 0.28);
      border-radius: 12px;
    }
  }
  &.hidden-scrollbar {
    .list-header {
      padding: 8px 12px;
    }
    .song-card {
      padding-right: 0;
    }
    .virt-list__client {
      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
  // 加载更多
  .load-more {
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 20px 0 40px;
    .n-spin-body {
      --n-size: 20px;
    }
    .n-divider {
      margin: 0;
      font-size: 14px;
      opacity: 0.6;
    }
  }
  // 加载
  &.loading {
    margin-top: 20px;
    :deep(.n-skeleton) {
      height: 72px;
      margin-bottom: 12px;
      border-radius: 12px;
    }
  }
  // 空列表
  &.empty {
    margin-top: 60px;
  }
}
.list-menu {
  position: fixed;
  right: 40px;
  bottom: 120px;
  .n-float-button {
    height: 42px;
    border: 1px solid rgba(var(--primary), 0.28);
  }
}
</style>
