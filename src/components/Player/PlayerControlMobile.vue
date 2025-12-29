<template>
  <div class="player-control-main">
    <Transition name="fade" mode="out-in">
      <div
        v-if="!statusStore.pureLyricMode && !statusStore.showPlayerComment"
        class="player-control-header"
      >
        <!-- 添加到歌单 -->
        <div
          class="menu-icon"
          @click.stop="openPlaylistAdd([musicStore.playSong], !!musicStore.playSong.path)"
        >
          <SvgIcon name="AddList" />
        </div>

        <!-- 下载 -->
        <div
          v-if="!musicStore.playSong.path"
          class="menu-icon"
          @click.stop="openDownloadSong(musicStore.playSong)"
        >
          <SvgIcon name="Download" />
        </div>
        <!-- 音质切换 -->
        <n-dropdown
          :options="qualityOptions"
          :show-arrow="true"
          :style="{ padding: 0 }"
          :class="{ player: statusStore.showFullPlayer }"
          :disabled="musicStore.isLocalSong"
          @select="(quality) => player.changeQuality(quality)"
        >
          <div class="menu-icon quality-selector">
            <span class="current-quality">{{ statusStore.playQuality }}</span>
          </div>
        </n-dropdown>
        <!-- 显示评论 -->
        <div v-if="!musicStore.playSong.path" class="menu-icon" @click.stop="showComment">
          <SvgIcon name="Message" />
        </div>

        <!--        &lt;!&ndash; 更多 &ndash;&gt;-->
        <!--        <div class="menu-icon" @click.stop="openDownloadSong(musicStore.playSong)">-->
        <!--          <SvgIcon name="More" />-->
        <!--        </div>-->
      </div>
    </Transition>
    <div class="player-control-middle">
      <!-- 进度条 -->
      <div class="slider">
        <span>{{ msToTime(statusStore.currentTime) }}</span>
        <PlayerSlider :show-tooltip="false" />
        <span>{{ msToTime(statusStore.duration) }}</span>
      </div>
    </div>
    <div class="player-control-footer">
      <div class="control-content" @click.stop>
        <n-flex class="left" align="center">
          <!-- 喜欢歌曲 -->
          <div
            class="menu-icon"
            @click="toLikeSong(musicStore.playSong, !dataStore.isLikeSong(musicStore.playSong))"
          >
            <SvgIcon
              :name="dataStore.isLikeSong(musicStore.playSong) ? 'Favorite' : 'FavoriteBorder'"
            />
          </div>
          <!-- 播放模式 -->
          <div class="menu-icon" @click.stop="player.togglePlayMode(false)">
            <SvgIcon :name="statusStore.playModeIcon" />
          </div>
        </n-flex>
        <div class="center">
          <div class="btn">
            <!-- 上一曲 -->
            <div
              v-if="!statusStore.radioMode"
              v-debounce="() => player.nextOrPrev('prev')"
              class="btn-icon"
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
              @click.stop="player.playOrPause()"
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
            <div v-debounce="() => player.nextOrPrev('next')" class="btn-icon">
              <SvgIcon :size="26" name="SkipNext" />
            </div>
          </div>
        </div>
        <n-flex class="right" align="center" justify="end">
          <!-- 音量调节 -->
          <n-popover
            :show-arrow="false"
            :style="{ padding: 0 }"
            :class="{ player: statusStore.showFullPlayer }"
          >
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
              <n-text class="slider-num"> {{ statusStore.playVolumePercent }}%</n-text>
            </div>
          </n-popover>
          <!-- 播放列表 -->
          <div
            v-if="!statusStore.radioMode"
            class="menu-icon"
            @click.stop="statusStore.playListShow = !statusStore.playListShow"
          >
            <SvgIcon name="PlayList" />
          </div>
        </n-flex>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, useMusicStore, usePlatformStore, useStatusStore } from "@/stores";
import { toLikeSong } from "@/utils/auth";
import { usePlayer } from "@/utils/player";
import type { DropdownOption } from "naive-ui";
import { openDownloadSong, openPlaylistAdd } from "@/utils/modal";
import { msToTime } from "@/utils/time";

const player = usePlayer();
const dataStore = useDataStore();
const musicStore = useMusicStore();
const statusStore = useStatusStore();
const platformStore = usePlatformStore();
const showComment = () => {
  statusStore.showPlayerComment = true;
};

// 音质选项
const qualityOptions = computed(() => {
  if (musicStore.isLocalSong) {
    return [
      {
        label: musicStore.playSong?.quality,
        key: musicStore.playSong?.quality,
      },
    ];
  }
  return musicStore.playSong?.links?.map((item): DropdownOption => {
    const desc = platformStore.getPlatformQualityDescription(
      musicStore.playSong?.platform,
      item.name,
    );
    return {
      label: desc ? `${item.name}(${desc})` : `${item.name}`,
      key: item.name,
    };
  });
});
</script>

<style lang="scss" scoped>
.player-control-main {
  width: 100%;
  display: flex;
  flex-direction: column;

  .player-control-header {
    position: absolute;
    left: 0;
    bottom: 80px;
    width: 100%;
    padding: 5px 2px;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .player-control-middle {
    width: 100%;
    display: flex;

    .slider {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      //max-width: 480px;
      font-size: 12px;
      cursor: pointer;
      padding: 0 5px;

      .n-slider {
        margin: 6px 8px;
        --n-handle-size: 12px;
        --n-rail-height: 4px;
      }

      span {
        opacity: 0.6;
      }
    }
  }

  .player-control-footer {
    width: 100%;
    //padding-top: 5px;
    overflow: hidden;
    cursor: pointer;

    .control-content {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      align-items: center;
    }

    .left,
    .right {
      opacity: 1;
      height: 100%;
      padding: 0;
      transition: opacity 0.3s;
    }

    .center {
      height: 100%;
      max-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .btn {
        display: flex;
        flex-direction: row;
        align-items: center;

        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          transition:
            backdrop-filter 0.3s,
            background-color 0.3s,
            transform 0.3s;
          cursor: pointer;

          .n-icon {
            color: rgb(var(--main-cover-color));
          }
        }

        .play-pause {
          --n-width: 44px;
          --n-height: 44px;
          --n-color: rgba(var(--main-cover-color), 0.14);
          --n-color-hover: rgba(var(--main-cover-color), 0.2);
          --n-color-focus: rgba(var(--main-cover-color), 0.2);
          --n-color-pressed: rgba(var(--main-cover-color), 0.12);
          backdrop-filter: blur(10px);
          margin: 0 12px;
          transition:
            background-color 0.3s,
            transform 0.3s;

          .n-icon {
            color: rgb(var(--main-cover-color));
            transition: opacity 0.1s ease-in-out;
          }

          :deep(.n-base-loading) {
            color: rgb(var(--main-cover-color));
          }

          &:hover {
            transform: scale(1.1);
          }

          &:active {
            transform: scale(1);
          }
        }
      }
    }
  }
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 8px;
  cursor: pointer;

  .n-icon {
    font-size: 24px;
    color: rgb(var(--main-cover-color));
  }
}

// volume
.volume-change {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  height: 200px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  background-color: rgba(var(--main-cover-color), 0.14);

  .slider-num {
    margin-top: 4px;
    font-size: 12px;
    color: rgb(var(--main-cover-color));
  }
}

// slider
.n-slider {
  --n-rail-color: rgba(var(--main-cover-color), 0.14);
  --n-rail-color-hover: rgba(var(--main-cover-color), 0.3);
  --n-fill-color: rgb(var(--main-cover-color));
  --n-handle-color: rgb(var(--main-cover-color));
  --n-fill-color-hover: rgb(var(--main-cover-color));
}
</style>
