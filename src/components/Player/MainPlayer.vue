<template>
  <div
    :class="[
      'main-player',
      {
        show: musicStore.isHasPlayer && statusStore.showPlayBar,
      },
    ]"
  >
    <!-- 进度条 -->
    <n-slider
      v-model:value="statusStore.progress"
      :step="0.01"
      :min="0"
      :max="100"
      :tooltip="false"
      :keyboard="false"
      class="player-slider"
      @dragstart="player.pause(false)"
      @dragend="sliderDragend"
    />
    <!-- 信息 -->
    <div class="play-data">
      <!-- 封面 -->
      <Transition name="fade" mode="out-in">
        <div
          :key="musicStore.playSong.cover"
          class="cover"
          @click.stop="statusStore.showFullPlayer = true"
        >
          <n-image
            :src="musicStore.songCover"
            :alt="musicStore.songCover"
            class="cover-img"
            preview-disabled
            @load="coverLoaded"
          >
            <template #placeholder>
              <div class="cover-loading">
                <img src="/images/song.jpg?assest" class="loading-img" alt="loading-img" />
              </div>
            </template>
          </n-image>
          <!-- 打开播放器 -->
          <SvgIcon name="Zoom" :size="30" />
        </div>
      </Transition>
      <!-- 信息 -->
      <Transition name="left-sm" mode="out-in">
        <div :key="musicStore.playSong.id" class="info">
          <div class="data">
            <!-- 名称 -->
            <TextContainer
              :key="musicStore.playSong.name"
              :text="musicStore.playSong.name"
              :speed="0.2"
              class="name"
            />
            <!-- 喜欢 -->
            <SvgIcon
              :name="dataStore.isLikeSong(musicStore.playSong) ? 'Favorite' : 'FavoriteBorder'"
              :size="20"
              class="like"
              @click="toLikeSong(musicStore.playSong, !dataStore.isLikeSong(musicStore.playSong))"
            />
            <!-- 更多操作 -->
            <n-dropdown :options="songMoreOptions" trigger="click" placement="top-start">
              <SvgIcon name="FormatList" :size="20" :depth="2" class="more" />
            </n-dropdown>
          </div>
          <Transition name="fade" mode="out-in">
            <!-- 歌词 -->
            <TextContainer
              v-if="isShowLyrics && instantLyrics"
              :key="instantLyrics"
              :text="instantLyrics"
              :speed="0.2"
              :delay="500"
              class="lyric"
            />
            <!-- 歌手 -->
            <div v-else class="artists">
              <template v-if="Array.isArray(musicStore.playSong.artists)">
                <n-text
                  v-for="(item, index) in musicStore.playSong.artists"
                  :key="index"
                  class="ar-item"
                  @click="openJumpArtist(musicStore.playSong.platform, musicStore.playSong.artists)"
                >
                  {{ item.name }}
                </n-text>
              </template>
              <n-text
                v-else
                class="ar-item"
                @click="openJumpArtist(musicStore.playSong.platform, musicStore.playSong.artists)"
              >
                {{ musicStore.playSong.artists || t("common.unknown_artist") }}
              </n-text>
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
    <!-- 控制 -->
    <div class="play-control">
      <!-- 上一曲 -->
      <div
        v-if="!statusStore.radioMode"
        class="play-icon"
        v-debounce="() => player.nextOrPrev('prev')"
      >
        <SvgIcon :size="26" name="SkipPrev" />
      </div>
      <!-- 播放暂停 -->
      <n-button
        :loading="statusStore.playLoading"
        :focusable="false"
        :keyboard="false"
        class="play-pause"
        type="primary"
        strong
        secondary
        circle
        v-debounce="() => player.playOrPause()"
      >
        <template #icon>
          <Transition name="fade" mode="out-in">
            <SvgIcon
              :key="statusStore.playStatus ? 'Pause' : 'Play'"
              :name="statusStore.playStatus ? 'Pause' : 'Play'"
              :size="28"
            />
          </Transition>
        </template>
      </n-button>
      <!-- 下一曲 -->
      <div class="play-icon" v-debounce="() => player.nextOrPrev('next')">
        <SvgIcon :size="26" name="SkipNext" />
      </div>
    </div>
    <!-- 功能 -->
    <Transition name="fade" mode="out-in">
      <n-flex
        :key="statusStore.radioMode ? 'fm' : 'normal'"
        :size="[8, 0]"
        class="play-menu"
        justify="end"
      >
        <!-- 播放时间 -->
        <div class="time">
          <n-text depth="2">{{ secondsToTime(statusStore.currentTime) }}</n-text>
          <n-text depth="2">{{ secondsToTime(statusStore.duration) }}</n-text>
        </div>
        <!-- 桌面歌词 -->
        <div v-if="isElectron" class="menu-icon" @click.stop="player.toggleDesktopLyric">
          <SvgIcon name="DesktopLyric" :depth="statusStore.showDesktopLyric ? 1 : 3" />
        </div>
        <!-- 音质切换 -->
        <n-dropdown
          :options="qualityOptions"
          :show-arrow="true"
          @select="(quality) => player.changeQuality(quality)"
        >
          <div class="menu-icon quality-selector">
            <span class="current-quality">{{ statusStore.playQuality }}</span>
          </div>
        </n-dropdown>
        <!-- 播放模式 -->
        <n-dropdown
          v-if="!statusStore.radioMode"
          :options="playModeOptions"
          :show-arrow="true"
          @select="(mode) => player.togglePlayMode(mode)"
        >
          <div class="menu-icon" @click.stop="player.togglePlayMode(false)">
            <SvgIcon :name="statusStore.playModeIcon" />
          </div>
        </n-dropdown>
        <!-- 音量调节 -->
        <n-popover :show-arrow="false" :style="{ padding: 0 }">
          <template #trigger>
            <div class="menu-icon" @click.stop="player.toggleMute" @wheel="player.setVolume">
              <SvgIcon :name="statusStore.playVolumeIcon" />
            </div>
          </template>
          <div class="volume-change" @wheel="player.setVolume">
            <n-slider
              v-model:value="statusStore.playVolume"
              :tooltip="false"
              :min="0"
              :max="1"
              :step="0.01"
              vertical
              @update:value="(val) => player.setVolume(val)"
            />
            <n-text class="slider-num">{{ statusStore.playVolumePercent }}%</n-text>
          </div>
        </n-popover>
        <!-- 播放列表 -->
        <n-badge
          v-if="!statusStore.radioMode"
          :value="dataStore.playList?.length ?? 0"
          :show="settingStore.showPlaylistCount"
          :max="999"
          :style="{
            marginRight: settingStore.showPlaylistCount ? '12px' : null,
          }"
        >
          <div class="menu-icon" @click.stop="statusStore.playListShow = !statusStore.playListShow">
            <SvgIcon name="PlayList" />
          </div>
        </n-badge>
      </n-flex>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DropdownOption } from "naive-ui";
import {
  useDataStore,
  useMusicStore,
  usePlatformStore,
  useSettingStore,
  useStatusStore,
} from "@/stores";
import { calculateCurrentTime, secondsToTime } from "@/utils/time";
import { isElectron, renderIcon, coverLoaded } from "@/utils/helper";
import { toLikeSong } from "@/utils/auth";
import { openDownloadSong, openJumpArtist, openPlaylistAdd } from "@/utils/modal";
import player from "@/utils/player";
import { FeatureSupportFlag } from "@/api/platform";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
const { t } = useI18n();

const router = useRouter();
const dataStore = useDataStore();
const musicStore = useMusicStore();
const statusStore = useStatusStore();
const settingStore = useSettingStore();
const platformStore = usePlatformStore();

// 播放模式数据
const playModeOptions = computed(() => [
  {
    label: t("common.play_mode_repeat"),
    key: "repeat",
    icon: renderIcon("Repeat"),
  },
  {
    label: t("common.play_mode_repeat_once"),
    key: "repeat-once",
    icon: renderIcon("RepeatSong"),
  },
  {
    label: t("common.play_mode_shuffle"),
    key: "shuffle",
    icon: renderIcon("Shuffle"),
  },
]);

// 歌曲更多操作
const songMoreOptions = computed<DropdownOption[]>(() => {
  // 当前状态
  const song = musicStore.playSong;
  const isHasMv = !!song?.mv_id;
  const isLocal = !!song?.path;
  return [
    {
      key: "playlist-add",
      label: t("menu.add_to_playlist"),
      props: {
        onClick: () => openPlaylistAdd([song], isLocal),
      },
      icon: renderIcon("AddList"),
    },
    {
      key: "mv",
      label: t("menu.watch_mv"),
      show: isHasMv,
      props: {
        onClick: () =>
          router.push({
            name: "video",
            query: { id: musicStore.playSong.mv_id, platform: song.platform, type: "mv" },
          }),
      },
      icon: renderIcon("Video", { size: 18 }),
    },
    {
      key: "download",
      label: t("common.download_song"),
      show: !isLocal,
      props: { onClick: () => openDownloadSong(musicStore.playSong) },
      icon: renderIcon("Download"),
    },
    {
      key: "comment",
      label: t("menu.view_comment"),
      show:
        !isLocal &&
        platformStore.isFeatureSupport(song.platform, FeatureSupportFlag.GetCommentList),
      props: {
        onClick: () => {
          statusStore.$patch({
            showFullPlayer: true,
            showPlayerComment: true,
          });
        },
      },
      icon: renderIcon("Message"),
    },
  ];
});

// 进度条拖拽结束
const sliderDragend = () => {
  const seek = calculateCurrentTime(statusStore.progress, statusStore.duration);
  statusStore.playStatus = true;
  // 调整进度
  player.setSeek(seek);
  player.play();
};

// 是否展示歌词
const isShowLyrics = computed(() => {
  const isHasLrc = musicStore.isHasLrc;
  return (
    isHasLrc && settingStore.barLyricShow && statusStore.playStatus && statusStore.lyricIndex !== -1
  );
});

// 当前实时歌词
const instantLyrics = computed(() => {
  const isYrc = musicStore.songLyric.yrcData?.length && settingStore.showYrc;
  const content = isYrc
    ? musicStore.songLyric.yrcData[statusStore.lyricIndex]
    : musicStore.songLyric.lrcData[statusStore.lyricIndex];
  return content?.tran && settingStore.showTran
    ? `${content?.content}（ ${content?.tran} ）`
    : content?.content;
});

// 音质选项
const qualityOptions = computed(() => {
  return musicStore.playSong?.links.map((item): DropdownOption => {
    return {
      label: item.name,
      key: item.name,
    };
  });
  // .flatMap((item: DropdownOption, idx: number): DropdownOption[] =>
  //   idx === musicStore.playSong?.links.length - 1
  //     ? [item]
  //     : [
  //         item,
  //         {
  //           key: `line-${idx}`,
  //           type: "divider",
  //         },
  //       ],
  // );
});
</script>

<style lang="scss" scoped>
.main-player {
  position: fixed;
  left: 0;
  bottom: -90px;
  height: 80px;
  padding: 0 15px;
  width: 100%;
  background-color: var(--surface-container-hex);
  // background-color: rgba(var(--surface-container), 0.28);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  transition: bottom 0.3s;
  z-index: 10;
  &.show {
    bottom: 0;
  }
  .player-slider {
    position: absolute;
    width: 100%;
    height: 16px;
    top: -8px;
    left: 0;
    margin: 0;
    --n-rail-height: 3px;
    --n-handle-size: 14px;
  }
  .play-data {
    display: flex;
    flex-direction: row;
    max-width: 100%;
    overflow: hidden;
    .cover {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 55px;
      height: 55px;
      min-width: 55px;
      border-radius: 8px;
      overflow: hidden;
      margin-right: 12px;
      transition: opacity 0.2s;
      cursor: pointer;
      :deep(img) {
        width: 55px;
        height: 55px;
        opacity: 0;
        transition:
          transform 0.3s,
          opacity 0.3s,
          filter 0.3s;
      }
      .n-icon {
        position: absolute;
        color: #eee;
        opacity: 0;
        transform: scale(0.6);
        transition:
          opacity 0.3s,
          transform 0.3s;
      }
      &:hover {
        :deep(img) {
          transform: scale(1.2);
          filter: brightness(0.6) blur(2px);
        }
        .n-icon {
          opacity: 1;
          transform: scale(1);
        }
      }
      &:active {
        .n-icon {
          transform: scale(1.2);
        }
      }
    }
    .info {
      display: flex;
      flex-direction: column;
      width: 100%;
      .data {
        display: flex;
        align-items: center;
        margin-top: 2px;
        .name {
          font-weight: bold;
          font-size: 16px;
          width: max-content;
          max-width: calc(100% - 100px);
          transition: color 0.3s;
        }
        .like {
          color: var(--primary-hex);
          margin-left: 8px;
          transition: transform 0.3s;
          cursor: pointer;
          &:hover {
            transform: scale(1.15);
          }
          &:active {
            transform: scale(1);
          }
        }
        .more {
          margin-left: 8px;
          cursor: pointer;
        }
      }
      .artists {
        margin-top: 2px;
        display: -webkit-box;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
        word-break: break-all;
        .ar-item {
          display: inline-flex;
          transition: color 0.3s;
          cursor: pointer;
          &::after {
            content: "/";
            margin: 0 6px;
            opacity: 0.6;
            transition: none;
          }
          &:last-child {
            &::after {
              display: none;
            }
          }
          &:hover {
            color: var(--primary-hex);
            &::after {
              color: var(--n-close-icon-color);
            }
          }
        }
      }
      .lyric {
        margin-top: 2px;
      }
    }
  }
  .play-control {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    .play-pause {
      --n-width: 44px;
      --n-height: 44px;
      margin: 0 12px;
      transition:
        background-color 0.3s,
        transform 0.3s;
      .n-icon {
        transition: opacity 0.1s ease-in-out;
      }
      &:hover {
        transform: scale(1.1);
      }
      &:active {
        transform: scale(1);
      }
    }
    .play-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      transition:
        background-color 0.3s,
        transform 0.3s;
      cursor: pointer;
      .n-icon {
        color: var(--primary-hex);
      }
      &:hover {
        transform: scale(1.1);
        background-color: rgba(var(--primary), 0.16);
      }
      &:active {
        transform: scale(1);
      }
    }
  }
  .play-menu {
    .time {
      display: flex;
      align-items: center;
      font-size: 12px;
      margin-right: 8px;
      .n-text {
        color: var(--primary-hex);
        opacity: 0.8;
        &:nth-of-type(1) {
          &::after {
            content: "/";
            margin: 0 4px;
          }
        }
      }
    }
    .quality-selector {
      display: flex;
      align-items: center;
      //gap: 4px;
    }

    .current-quality {
      font-size: 12px;
      font-weight: 500;
      color: var(--primary-hex);
    }

    .menu-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: 8px;
      transition:
        background-color 0.3s,
        transform 0.3s;
      cursor: pointer;
      .n-icon {
        font-size: 22px;
        color: var(--primary-hex);
      }
      &:hover {
        transform: scale(1.1);
        background-color: rgba(var(--primary), 0.28);
      }
      &:active {
        transform: scale(1);
      }
    }
    :deep(.n-badge-sup) {
      background-color: rgba(var(--primary), 0.28);
      backdrop-filter: blur(20px);
      .n-base-slot-machine {
        color: var(--primary-hex);
      }
    }
  }
}
// 音量调节
.volume-change {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  height: 200px;
  padding: 12px 16px;
  .slider-num {
    margin-top: 4px;
    font-size: 12px;
  }
}
</style>
