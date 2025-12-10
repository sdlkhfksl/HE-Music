<template>
  <n-flex :size="8" align="center" class="right-menu" :wrap="false">
    <!-- 音质切换 -->
    <n-dropdown
      :options="qualityOptions"
      :show-arrow="true"
      :disabled="musicStore.isLocalSong"
      @select="(quality) => player.changeQuality(quality)"
    >
      <div class="menu-icon quality-selector">
        <span class="current-quality">{{ statusStore.playQuality }}</span>
      </div>
    </n-dropdown>

    <n-badge v-if="isElectron" value="ON" :show="statusStore.showDesktopLyric">
      <div class="menu-icon" @click.stop="player.toggleDesktopLyric">
        <SvgIcon name="DesktopLyric2" :depth="statusStore.showDesktopLyric ? 1 : 3" />
      </div>
    </n-badge>

    <!-- 其他控制 -->
    <n-dropdown :options="controlsOptions" :show-arrow="false">
      <div class="menu-icon controls">
        <SvgIcon name="Controls" />
      </div>
    </n-dropdown>
    <!-- 播放模式 -->
    <n-dropdown
      v-if="!statusStore.radioMode"
      :options="playModeOptions"
      :show-arrow="false"
      @select="(mode) => player.togglePlayMode(mode)"
    >
      <div class="menu-icon play-mode" @click.stop="player.togglePlayMode(false)">
        <SvgIcon :name="statusStore.playModeIcon" />
      </div>
    </n-dropdown>
    <!-- 音量调节 -->
    <n-popover :show-arrow="false" :style="{ padding: 0 }">
      <template #trigger>
        <div
          class="menu-icon volume-mute"
          @click.stop="player.toggleMute"
          @wheel="player.setVolume"
        >
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
          @update:value="(val: number) => player.setVolume(val)"
        />
        <n-text class="slider-num">{{ statusStore.playVolumePercent }}%</n-text>
      </div>
    </n-popover>

    <n-button
      v-debounce="() => player.playOrPause()"
      :loading="statusStore.playLoading"
      :focusable="false"
      :keyboard="false"
      class="play-pause"
      type="primary"
      strong
      secondary
      circle
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

    <!-- 播放列表 -->
    <n-badge
      v-if="!statusStore.radioMode"
      :value="dataStore.playList?.length ?? 0"
      :show="settingStore.showPlaylistCount && !isMobile"
      :max="9999"
      :style="{
        marginRight: !isMobile && settingStore.showPlaylistCount ? '12px' : null,
      }"
    >
      <div class="menu-icon" @click.stop="statusStore.playListShow = !statusStore.playListShow">
        <SvgIcon name="PlayList" />
      </div>
    </n-badge>
  </n-flex>
</template>

<script setup lang="ts">
import type { DropdownOption } from "naive-ui";
import {
  useStatusStore,
  useDataStore,
  useSettingStore,
  useMusicStore,
  usePlatformStore,
} from "@/stores";
import { openAutoClose, openChangeRate, openEqualizer } from "@/utils/modal";
import { isElectron, isMobile } from "@/utils/env";
import { renderIcon } from "@/utils/helper";
import { usePlayer } from "@/utils/player";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const player = usePlayer();
const dataStore = useDataStore();
const statusStore = useStatusStore();
const settingStore = useSettingStore();
const musicStore = useMusicStore();
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

// 其他控制：播放速度下拉菜单
const controlsOptions = computed<DropdownOption[]>(() => [
  {
    label: t("common.equalizer"),
    key: "equalizer",
    icon: renderIcon("Eq"),
    props: {
      onClick: () => openEqualizer(),
    },
  },
  {
    label: t("common.auto_close"),
    key: "autoClose",
    icon: renderIcon("TimeAuto"),
    props: {
      onClick: () => openAutoClose(),
    },
  },
  {
    label: t("common.play_rate"),
    key: "rate",
    icon: renderIcon("PlayRate"),
    props: {
      onClick: () => openChangeRate(),
    },
  },
]);
</script>

<style scoped lang="scss">
.right-menu {
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
      font-size: 20px;
      color: var(--primary-hex);
    }
    &:hover {
      transform: scale(1.1);
      background-color: rgba(var(--primary), 0.28);
    }
    &:active {
      transform: scale(1);
    }
    @media (max-width: 768px) {
      padding: 2px;
    }
  }

  :deep(.n-badge-sup) {
    background-color: rgba(var(--primary), 0.28);
    backdrop-filter: blur(20px);
    // font-size: 10px;
    .n-base-slot-machine {
      color: var(--primary-hex);
    }
  }
  .quality-selector {
    display: flex;
    align-items: center;
  }

  .current-quality {
    font-size: 10px;
    font-weight: 500;
    color: var(--primary-hex);
  }
  .play-pause {
    display: none;
  }
}
.volume-change {
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 180px;
  width: 58px;
  align-items: center;
  .slider-num {
    margin-top: 8px;
    font-size: 13px;
    color: var(--color);
    white-space: nowrap;
  }
}

@media (max-width: 768px) {
  .right-menu {
    .quality-selector,
    .controls,
    .play-mode,
    .volume-mute {
      display: none;
    }

    .play-pause {
      display: flex;
    }
  }
}
</style>
