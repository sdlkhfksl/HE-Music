<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.lyrics.lyrics_setting") }}
      </n-h3>
      <n-card
        id="lyrics-show"
        :content-style="{
          'flex-direction': 'column',
          'align-items': settingStore.lyricsPosition,
          '--font-weight': settingStore.lyricFontBold ? 'bold' : 'normal',
          '--font-size': settingStore.lyricFontSize,
          '--font-tran-size': settingStore.lyricTranFontSize,
          '--font-roma-size': settingStore.lyricRomaFontSize,
          '--transform-origin':
            settingStore.lyricsPosition === 'center'
              ? 'center'
              : settingStore.lyricsPosition === 'flex-start'
                ? 'left'
                : 'right',
        }"
        class="set-item"
      >
        <div v-for="item in 2" :key="item" :class="['lrc-item', { on: item === 2 }]">
          <n-text>我是一句歌词</n-text>
          <n-text v-if="settingStore.showTran"> I'm the lyric </n-text>
          <n-text v-if="settingStore.showRoma"> wo shi yi ju ge ci </n-text>
        </div>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_font_size") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_font_size_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.lyricFontSize !== 46"
              type="primary"
              strong
              secondary
              @click="settingStore.lyricFontSize = 46"
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-input-number
            v-model:value="settingStore.lyricFontSize"
            :min="12"
            :max="60"
            class="set"
            :placeholder="t('setting.lyrics.lyrics_font_size_placeholder')"
            @blur="settingStore.lyricFontSize === null ? (settingStore.lyricFontSize = 30) : null"
          >
            <template #suffix> px </template>
          </n-input-number>
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_tran_font_size") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_tran_font_size_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.lyricTranFontSize !== 22"
              type="primary"
              strong
              secondary
              @click="settingStore.lyricTranFontSize = 22"
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-input-number
            v-model:value="settingStore.lyricTranFontSize"
            :min="5"
            :max="40"
            :disabled="settingStore.useAMLyrics"
            class="set"
            :placeholder="t('setting.lyrics.lyrics_tran_font_size_placeholder')"
            @blur="
              settingStore.lyricTranFontSize === null ? (settingStore.lyricTranFontSize = 22) : null
            "
          >
            <template #suffix> px </template>
          </n-input-number>
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_roma_font_size") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_roma_font_size_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.lyricRomaFontSize !== 18"
              type="primary"
              strong
              secondary
              @click="settingStore.lyricRomaFontSize = 18"
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-input-number
            v-model:value="settingStore.lyricRomaFontSize"
            :min="12"
            :max="40"
            :disabled="settingStore.useAMLyrics"
            class="set"
            :placeholder="t('setting.lyrics.lyrics_roma_font_size_placeholder')"
            @blur="
              settingStore.lyricRomaFontSize === null ? (settingStore.lyricRomaFontSize = 18) : null
            "
          >
            <template #suffix> px </template>
          </n-input-number>
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_font_bold") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_font_bold_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.lyricFontBold" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_position") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_position_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.lyricsPosition"
          :disabled="settingStore.useAMLyrics"
          :options="[
            {
              label: t('setting.lyrics.lyrics_position_value_left'),
              value: 'flex-start',
            },
            {
              label: t('setting.lyrics.lyrics_position_value_center'),
              value: 'center',
            },
            {
              label: t('setting.lyrics.lyrics_position_value_right'),
              value: 'flex-end',
            },
          ]"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_scroll_position") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_scroll_position_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.lyricsScrollPosition"
          :options="[
            {
              label: t('setting.lyrics.lyrics_scroll_position_value_top'),
              value: 'start',
            },
            {
              label: t('setting.lyrics.lyrics_scroll_position_value_center'),
              value: 'center',
            },
          ]"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_mouse_pause") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_mouse_pause_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.lrcMousePause"
          :disabled="settingStore.useAMLyrics"
          :round="false"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.show_font_lyrics") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showYrc" class="set" :round="false" />
      </n-card>
      <n-collapse-transition :show="settingStore.showYrc">
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">
              {{ t("setting.lyrics.show_font_lyrics_animation") }}
            </n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.lyrics.show_font_lyrics_animation_tip") }}
            </n-text>
          </div>
          <n-switch
            v-model:value="settingStore.showYrcAnimation"
            :disabled="settingStore.useAMLyrics"
            :round="false"
            class="set"
          />
        </n-card>
      </n-collapse-transition>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.show_lyrics_trans") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showTran" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.show_lyrics_roma") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showRoma" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_blur") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_blur_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.lyricsBlur" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.lyrics_exclude") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.lyrics_exclude_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.enableLyricsExclude" class="set" :round="false" />
      </n-card>
      <n-collapse-transition :show="settingStore.enableLyricsExclude">
        <!--        <n-card class="set-item">-->
        <!--          <div class="label">-->
        <!--            <n-text class="name">{{ t("setting.lyrics.lyrics_exclude_ttml") }}</n-text>-->
        <!--            <n-text class="tip" :depth="3">-->
        <!--              {{ t("setting.lyrics.lyrics_exclude_ttml_tip") }}-->
        <!--            </n-text>-->
        <!--          </div>-->
        <!--          <n-switch v-model:value="settingStore.enableTTMLExclude" class="set" :round="false" />-->
        <!--        </n-card>-->
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">{{ t("setting.lyrics.lyrics_exclude_local") }}</n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.lyrics.lyrics_exclude_local_tip") }}
            </n-text>
          </div>
          <n-switch
            v-model:value="settingStore.enableLocalLyricsExclude"
            class="set"
            :round="false"
          />
        </n-card>
        <n-card class="set-item">
          <div class="label">
            <n-text class="name"> {{ t("setting.lyrics.lyrics_exclude_content") }}</n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.lyrics.lyrics_exclude_content_tip") }}
            </n-text>
          </div>
          <n-button type="primary" strong secondary @click="openLyricExclude">
            {{ t("common.configuration") }}</n-button
          >
        </n-card>
      </n-collapse-transition>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar"> Apple Music-like Lyrics </n-h3>
      <n-tag type="warning" size="small" round> Beta </n-tag>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.use_am_lyrics") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.use_am_lyrics_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.useAMLyrics" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.am_lyrics_spring") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.am_lyrics_spring_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.useAMSpring" class="set" :round="false" />
      </n-card>
      <!--      <n-card class="set-item">-->
      <!--        <div class="label">-->
      <!--          <n-text class="name">{{ t("setting.lyrics.enable_online_ttml_lyrics") }}</n-text>-->
      <!--          <n-text class="tip" :depth="3">-->
      <!--            {{ t("setting.lyrics.enable_online_ttml_lyrics_tip") }}-->
      <!--          </n-text>-->
      <!--        </div>-->
      <!--        <n-switch v-model:value="settingStore.enableTTMLLyrics" class="set" :round="false" />-->
      <!--      </n-card>-->
    </div>
    <div v-if="isElectron" class="set-list">
      <n-h3 prefix="bar">
        {{ t("common.desktop_lyrics") }}
      </n-h3>
      <n-tag type="warning" size="small" round>Beta</n-tag>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.show_desktop_lyrics") }}
          </n-text>
        </div>
        <n-switch
          :value="statusStore.showDesktopLyric"
          :round="false"
          class="set"
          @update:value="player.toggleDesktopLyric"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_lock") }}</n-text>
          <n-text class="tip" :depth="3">{{ t("setting.lyrics.desktop_lyrics_lock_tip") }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.isLock"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_double_line") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_double_line_tip")
          }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.isDoubleLine"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_limit_bounds") }}</n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.desktop_lyrics_limit_bounds_tip") }}</n-text
          >
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.limitBounds"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <!-- position -->
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_align") }}</n-text>

          <n-text class="tip" :depth="3">{{ t("setting.lyrics.desktop_lyrics_align_tip") }}</n-text>
        </div>
        <n-select
          v-model:value="desktopLyricConfig.position"
          :options="[
            { label: t('setting.lyrics.desktop_lyrics_align_value_left'), value: 'left' },
            { label: t('setting.lyrics.desktop_lyrics_align_value_center'), value: 'center' },
            { label: t('setting.lyrics.desktop_lyrics_align_value_right'), value: 'right' },
            { label: t('setting.lyrics.desktop_lyrics_align_value_both'), value: 'both' },
          ]"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_font_family") }}</n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.desktop_lyrics_font_family_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="desktopLyricConfig.fontFamily !== 'system-ui'"
              type="primary"
              strong
              secondary
              @click="
                () => {
                  desktopLyricConfig.fontFamily = 'system-ui';
                  saveDesktopLyricConfig();
                }
              "
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-select
            v-model:value="desktopLyricConfig.fontFamily"
            :options="allFontsWithDefault"
            class="set"
            filterable
            @update:value="saveDesktopLyricConfig"
          />
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.show_desktop_font_lyrics") }}</n-text>
          <n-text class="tip" :depth="3">{{ t("setting.lyrics.show_desktop_font_lyrics") }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.showYrc"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.show_desktop_lyrics_trans") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.show_desktop_lyrics_trans_tip")
          }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.showTran"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_font_bold") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_font_bold_tip")
          }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.fontIsBold"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name"> {{ t("setting.lyrics.desktop_lyrics_font_size") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_font_size_tip")
          }}</n-text>
        </div>
        <n-select
          v-model:value="desktopLyricConfig.fontSize"
          :options="
            Array.from({ length: 96 - 20 + 1 }, (_, i) => {
              return {
                label: `${20 + i} px`,
                value: 20 + i,
              };
            })
          "
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_font_color_played") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_font_color_played_tip")
          }}</n-text>
        </div>
        <n-color-picker
          v-model:value="desktopLyricConfig.playedColor"
          :show-alpha="false"
          :modes="['hex']"
          class="set"
          @complete="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{ t("setting.lyrics.desktop_lyrics_font_color_unplayed") }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_font_color_unplayed_tip")
          }}</n-text>
        </div>
        <n-color-picker
          v-model:value="desktopLyricConfig.unplayedColor"
          :show-alpha="false"
          :modes="['hex']"
          class="set"
          @complete="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.desktop_lyrics_shadow_color") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.desktop_lyrics_shadow_color_tip") }}
          </n-text>
        </div>
        <n-color-picker
          v-model:value="desktopLyricConfig.shadowColor"
          :modes="['rgb']"
          class="set"
          @complete="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{
            t("setting.lyrics.desktop_lyrics_text_background_mask")
          }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.textBackgroundMask"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">{{
            t("setting.lyrics.desktop_lyrics_always_show_play_info")
          }}</n-text>
          <n-text class="tip" :depth="3">{{
            t("setting.lyrics.desktop_lyrics_always_show_play_info_tip")
          }}</n-text>
        </div>
        <n-switch
          v-model:value="desktopLyricConfig.alwaysShowPlayInfo"
          :round="false"
          class="set"
          @update:value="saveDesktopLyricConfig"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.lyrics.desktop_lyrics_reset_default") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.lyrics.desktop_lyrics_reset_default_tip") }}
          </n-text>
        </div>
        <n-button type="primary" @click="restoreDesktopLyricConfig">
          {{ t("common.reset_default") }}
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore, useStatusStore } from "@/stores";
import { cloneDeep, isEqual } from "lodash-es";
import { isElectron } from "@/utils/env";
import { openLyricExclude } from "@/utils/modal";
import { useI18n } from "vue-i18n";
import { LyricConfig } from "@/types/desktop-lyric";
import defaultDesktopLyricConfig from "@/assets/data/lyricConfig";
import { usePlayer } from "@/utils/player";
import type { SelectOption } from "naive-ui";
import { computed } from "vue";

const { t } = useI18n();

const player = usePlayer();
const statusStore = useStatusStore();
const settingStore = useSettingStore();

// 全部字体
const allFontsData = ref<SelectOption[]>([]);
// 桌面歌词配置
const desktopLyricConfig = reactive<LyricConfig>({ ...defaultDesktopLyricConfig });

// 获取桌面歌词配置
const getDesktopLyricConfig = async () => {
  if (!isElectron) return;
  const config = await window.electron.ipcRenderer.invoke("request-desktop-lyric-option");
  if (config) Object.assign(desktopLyricConfig, config);
  // 监听更新
  window.electron.ipcRenderer.on("update-desktop-lyric-option", (_, config) => {
    if (config && !isEqual(desktopLyricConfig, config)) {
      Object.assign(desktopLyricConfig, config);
    }
  });
};

// 保存桌面歌词配置
const saveDesktopLyricConfig = () => {
  try {
    if (!isElectron) return;
    console.log(cloneDeep(desktopLyricConfig));
    window.electron.ipcRenderer.send(
      "update-desktop-lyric-option",
      cloneDeep(desktopLyricConfig),
      true,
    );
    window.$message.success(t("message.desktop_lyrics_save_success"));
  } catch (error) {
    console.error("Failed to save options:", error);
    window.$message.error(t("message.desktop_lyrics_save_fail"));
    getDesktopLyricConfig();
  }
};

// 恢复默认桌面歌词配置
const restoreDesktopLyricConfig = () => {
  try {
    if (!isElectron) return;
    window.$dialog.warning({
      title: t("common.warning"),
      content: t("message.desktop_lyrics_reset_confirm"),
      positiveText: t("common.ok"),
      negativeText: t("common.cancel"),
      onPositiveClick: () => {
        window.electron.ipcRenderer.send(
          "update-desktop-lyric-option",
          defaultDesktopLyricConfig,
          true,
        );
        window.$message.success(t("message.desktop_lyrics_reset_success"));
        console.log(defaultDesktopLyricConfig, desktopLyricConfig);
      },
    });
  } catch (error) {
    console.error("Failed to save options:", error);
    window.$message.error(t("message.desktop_lyrics_reset_fail"));
    getDesktopLyricConfig();
  }
};

const allFontsWithDefault = computed(() => {
  return [
    {
      label: t("common.system_default"),
      value: "system-ui",
      style: {
        fontFamily: "system-ui",
      },
    },
    ...allFontsData.value,
  ];
});

// 获取全部系统字体
const getAllSystemFonts = async () => {
  const allFonts = await window.electron.ipcRenderer.invoke("get-all-fonts");
  allFonts.map((v: string) => {
    // 去除前后的引号
    v = v.replace(/^['"]+|['"]+$/g, "");
    allFontsData.value.push({
      label: v,
      value: v,
      style: {
        fontFamily: v,
      },
    });
  });
};

onMounted(() => {
  if (isElectron) {
    getDesktopLyricConfig();
    getAllSystemFonts();
  }
});
</script>

<style lang="scss" scoped>
#lyrics-show {
  .lrc-item {
    display: flex;
    flex-direction: column;
    opacity: 0.3;
    transform-origin: var(--transform-origin);
    transform: scale(0.86);
    transition: all 0.3s;
    &.on {
      opacity: 1;
      transform: scale(1);
    }
    .n-text {
      &:nth-of-type(1) {
        font-weight: var(--font-weight);
        font-size: calc(var(--font-size) * 1px);
      }
      &:nth-of-type(2) {
        opacity: 0.6;
        font-size: calc(var(--font-tran-size) * 1px);
      }
      &:nth-of-type(3) {
        opacity: 0.6;
        font-size: calc(var(--font-roma-size) * 1px);
      }
    }
  }
}
</style>
