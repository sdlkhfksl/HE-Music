<!-- 播放设置 -->
<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.play.play_setting") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.auto_play") }}
          </n-text>
          <n-text v-if="isElectron" class="tip" :depth="3">
            {{ t("setting.play.auto_play_tip") }}
          </n-text>
          <n-text v-else class="tip" :depth="3">
            {{ t("setting.play.auto_play_not_support_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.autoPlay"
          class="set"
          :round="false"
          :disabled="!isElectron"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.memory_last_seek") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.memory_last_seek_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.memoryLastSeek" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.song_volume_fade") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.songVolumeFade" class="set" :round="false" />
      </n-card>
      <n-collapse-transition :show="settingStore.songVolumeFade">
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">
              {{ t("setting.play.song_volume_fade_time") }}
            </n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.play.song_volume_fade_time_tip") }}
            </n-text>
          </div>
          <n-input-number
            v-model:value="settingStore.songVolumeFadeTime"
            :min="200"
            :max="2000"
            :show-button="false"
            class="set"
            :placeholder="t('setting.play.song_volume_fade_time_placeholder')"
          >
            <template #suffix> ms </template>
          </n-input-number>
        </n-card>
      </n-collapse-transition>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.online_song_quality") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ songLevelData[settingStore.songLevel]?.tip }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.songLevel"
          :options="Object.values(songLevelData)"
          :render-option="renderOption"
          class="set"
        />
      </n-card>
      <!--      <n-card v-if="!isElectron" class="set-item">-->
      <!--        <div class="label">-->
      <!--          <n-text class="name">播放试听</n-text>-->
      <!--          <n-text class="tip" :depth="3">是否在非会员状态下播放试听歌曲</n-text>-->
      <!--        </div>-->
      <!--        <n-switch v-model:value="settingStore.playSongDemo" class="set" :round="false" />-->
      <!--      </n-card>-->
      <n-card v-if="isElectron" class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.unlock_music") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.unlock_music_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.useSongUnlock" class="set" :round="false" />
      </n-card>
      <!--      <n-card class="set-item">-->
      <!--        <div class="label">-->
      <!--          <n-text class="name">听歌打卡</n-text>-->
      <!--          <n-text class="tip" :depth="3">是否将播放歌曲同步至网易云音乐</n-text>-->
      <!--        </div>-->
      <!--        <n-switch v-model:value="settingStore.scrobbleSong" class="set" :round="false" />-->
      <!--      </n-card>-->
      <n-card v-if="isElectron" class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.output_device") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.output_device_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.playDevice"
          class="set"
          :options="outputDevices"
          :render-option="renderOption"
          @update:value="playDeviceChange"
        />
      </n-card>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("common.player") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.player_type") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.player_type_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.playerType"
          :options="[
            {
              label: t('setting.play.player_tip_value_cover'),
              value: 'cover',
            },
            {
              label: t('setting.play.player_tip_value_record'),
              value: 'record',
            },
          ]"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.player_background_type") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.player_background_type_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.playerBackgroundType"
          :options="[
            {
              label: t('setting.play.player_background_type_value_animation'),
              disabled: true,
              value: 'animation',
            },
            {
              label: t('setting.play.player_background_type_value_blur'),
              value: 'blur',
            },
            {
              label: t('setting.play.player_background_type_value_color'),
              disabled: true,
              value: 'color',
            },
            {
              label: t('setting.play.player_background_type_value_none'),
              disabled: true,
              value: 'none',
            },
          ]"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.full_player_cache") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.full_player_cache_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.fullPlayerCache" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.count_down_show") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.count_down_show_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.countDownShow" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.bar_lyric_show") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.bar_lyric_show_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.barLyricShow" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.show_playlist_count") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showPlaylistCount" class="set" :round="false" />
      </n-card>
      <n-card v-if="isElectron" class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.show_spectrum") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.show_spectrum_tip") }}
          </n-text>
        </div>
        <n-switch
          class="set"
          :value="showSpectrums"
          :round="false"
          @update:value="showSpectrumsChange"
        />
      </n-card>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.play.system_integration") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.smtc") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.smtc_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.smtcOpen" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.play.smtc_output_high_quality_cover") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.play.smtc_output_high_quality_cover_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.smtcOutputHighQualityCover"
          class="set"
          :round="false"
          :disabled="!settingStore.smtcOpen || true"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from "naive-ui";
import { useSettingStore, useStatusStore } from "@/stores";
import { isElectron, renderOption } from "@/utils/helper";
import { uniqBy } from "lodash";
import player from "@/utils/player";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
const { t } = useI18n();
const settingStore = useSettingStore();
const statusStore = useStatusStore();

// 输出设备数据
const outputDevices = ref<SelectOption[]>([]);

// 显示音乐频谱
const showSpectrums = ref<boolean>(settingStore.showSpectrums);

// 音质数据
const songLevelData = computed(() => ({
  auto: {
    label: t("common.auto"),
    tip: t("setting.play.song_quality_value_auto_tip", { quality: statusStore.selectedQuality }),
    value: "auto",
  },
  "128mp3": {
    label: "128mp3",
    tip: t("setting.play.song_quality_value_128mp3_tip"),
    value: "128mp3",
  },
  "192mp3": {
    label: "192mp3",
    tip: t("setting.play.song_quality_value_192mp3_tip"),
    value: "192mp3",
  },
  "320mp3": {
    label: "320mp3",
    tip: t("setting.play.song_quality_value_320mp3_tip"),
    value: "320mp3",
  },
  flac: {
    label: "flac",
    tip: t("setting.play.song_quality_value_flac_tip"),
    value: "flac",
  },
  hires: {
    label: "hires",
    tip: t("setting.play.song_quality_value_hires_tip"),
    value: "hires",
  },
  dolby: {
    label: "dolby",
    tip: t("setting.play.song_quality_value_dolby_tip"),
    value: "dolby",
  },
  galaxy: {
    label: "galaxy",
    tip: t("setting.play.song_quality_value_galaxy_tip"),
    value: "galaxy",
  },
  master: {
    label: "master",
    tip: t("setting.play.song_quality_value_master_tip"),
    value: "master",
  },
  // jymaster: {
  //   label: "超清母带 Master",
  //   tip: "还原音频细节，192kHz/24bit",
  //   value: "jymaster",
  // },
  // sky: {
  //   label: "沉浸环绕声 Surround Audio",
  //   tip: "沉浸式体验，最高 5.1 声道",
  //   value: "sky",
  // },
}));

// 获取全部输出设备
const getOutputDevices = async () => {
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  // 过滤同一设备输出源
  const devices = uniqBy(
    allDevices.filter((device) => device.kind === "audiooutput" && device.deviceId),
    "groupId",
  );
  const outputData = devices.filter((device) => device.kind === "audiooutput");
  outputDevices.value = outputData.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));
};

// 切换输出设备
const playDeviceChange = (deviceId: string, option: SelectOption) => {
  if (isElectron && settingStore.showSpectrums) {
    window.$dialog.warning({
      title: t("setting.play.output_device_audio_channel_occupancy"),
      content: t("message.output_device_audio_channel_occupancy_confirm"),
      positiveText: t("common.continue"),
      negativeText: t("common.cancel"),
      closeOnEsc: false,
      closable: false,
      maskClosable: false,
      autoFocus: false,
      onPositiveClick: () => {
        showSpectrums.value = false;
        settingStore.showSpectrums = false;
        player.toggleOutputDevice(deviceId);
        window.$message.success(
          t("message.output_device_change_success", { device: option.label }),
        );
      },
      onNegativeClick: () => {
        settingStore.playDevice = "default";
      },
    });
  } else {
    player.toggleOutputDevice(deviceId);
    window.$message.success(t("message.output_device_change_success", { device: option.label }));
  }
};

// 显示音乐频谱更改
const showSpectrumsChange = (value: boolean) => {
  if (value) {
    if (settingStore.playDevice !== "default") {
      window.$dialog.warning({
        title: t("setting.play.spectrum_audio_channel_occupancy"),
        content: t("message.spectrum_audio_channel_occupancy_confirm"),
        positiveText: t("common.ok"),
        negativeText: t("common.cancel"),
        onPositiveClick: () => {
          showSpectrums.value = true;
          settingStore.showSpectrums = true;
          settingStore.playDevice = "default";
          player.toggleOutputDevice("default");
        },
      });
      return;
    }
    showSpectrums.value = true;
    settingStore.showSpectrums = true;
  } else {
    showSpectrums.value = false;
    settingStore.showSpectrums = false;
  }
};

onMounted(() => {
  if (isElectron) {
    getOutputDevices();
  }
});
</script>
