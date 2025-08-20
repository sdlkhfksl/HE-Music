<!-- 常规设置 -->
<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.general.theme_setting") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("common.language") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.language_tip") }}
          </n-text>
        </div>
        <n-select v-model:value="settingStore.language" class="set" :options="languageOptions" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.theme_mode") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.theme_mode_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.themeMode"
          class="set"
          :options="[
            {
              label: t('setting.general.theme_mode_value_auto'),
              value: 'auto',
            },
            {
              label: t('setting.general.theme_mode_value_light'),
              value: 'light',
            },
            {
              label: t('setting.general.theme_mode_value_dark'),
              value: 'dark',
            },
          ]"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.theme_color") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.theme_color_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.themeColorType"
          class="set"
          :disabled="settingStore.themeFollowCover"
          :options="themeColorOptions"
        />
      </n-card>
      <n-collapse-transition
        :show="settingStore.themeColorType === 'custom' && !settingStore.themeFollowCover"
      >
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">
              {{ t("setting.general.theme_color_custom") }}
            </n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.general.theme_color_custom_tip") }}
            </n-text>
          </div>
          <n-color-picker
            v-model:value="settingStore.themeCustomColor"
            class="set"
            :show-alpha="false"
            :modes="['hex']"
          />
        </n-card>
      </n-collapse-transition>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.theme_global_color") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.theme_global_color_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.themeGlobalColor"
          class="set"
          :round="false"
          @update:value="themeGlobalColorChange"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.theme_follow_cover") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.theme_follow_cover_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.themeFollowCover"
          :disabled="isEmpty(statusStore.songCoverTheme)"
          class="set"
          :round="false"
        />
      </n-card>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.general.misc_setting") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.show_search_history") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showSearchHistory" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.menu_show_cover") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.menu_show_cover_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.menuShowCover" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.use_keep_alive") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.use_keep_alive_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.useKeepAlive" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.route_animation") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.route_animation_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.routeAnimation"
          :options="[
            {
              label: t('setting.general.route_animation_value_none'),
              value: 'none',
            },
            {
              label: t('setting.general.route_animation_value_fade'),
              value: 'fade',
            },
            {
              label: t('setting.general.route_animation_value_zoom'),
              value: 'zoom',
            },
            {
              label: t('setting.general.route_animation_value_slide'),
              value: 'slide',
            },
            {
              label: t('setting.general.route_animation_value_up'),
              value: 'up',
            },
          ]"
          class="set"
        />
      </n-card>
    </div>
    <div v-if="isElectron" class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.general.system_setting") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.use_online_service") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.use_online_service_tip") }}
          </n-text>
        </div>
        <n-switch class="set" :value="useOnlineService" :round="false" @update:value="modeChange" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.custom_font") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.custom_font_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.globalFont !== 'default'"
              type="primary"
              strong
              secondary
              @click="settingStore.globalFont = 'default'"
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-select v-model:value="settingStore.globalFont" :options="allFontsData" class="set" />
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.lyric_font") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.lyric_font_tip") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.LyricFont !== 'follow'"
              type="primary"
              strong
              secondary
              @click="settingStore.LyricFont = 'follow'"
            >
              {{ t("common.reset_default") }}
            </n-button>
          </Transition>
          <n-select
            v-model:value="settingStore.LyricFont"
            :options="[
              { label: t('setting.general.lyric_font_follow_global'), value: 'follow' },
              ...allFontsData.filter((v) => v.value !== 'default'),
            ]"
            class="set"
          />
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.close_software") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.close_software_tip") }}
          </n-text>
        </div>
        <n-select
          v-model:value="settingStore.closeAppMethod"
          :disabled="settingStore.showCloseAppTip"
          :options="[
            {
              label: t('setting.general.close_software_value_hide'),
              value: 'hide',
            },
            {
              label: t('setting.general.close_software_value_close'),
              value: 'close',
            },
          ]"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.show_close_app_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showCloseAppTip" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.show_taskbar_progress") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.show_taskbar_progress_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.showTaskbarProgress"
          class="set"
          :round="false"
          @update:value="closeTaskbarProgress"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.prevent_sleep") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.prevent_sleep_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.preventSleep" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.general.check_update_on_start") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.general.check_update_on_start_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.checkUpdateOnStart" class="set" :round="false" />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from "naive-ui";
import { useMusicStore, useSettingStore, useStatusStore } from "@/stores";
import { isElectron } from "@/utils/helper";
import { isEmpty } from "lodash-es";
import themeColor from "@/assets/data/themeColor.json";
import player from "@/utils/player";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

// 国际化
const { t } = useI18n();
const musicStore = useMusicStore();
const settingStore = useSettingStore();
const statusStore = useStatusStore();

// 全部字体
const allFontsData = ref<SelectOption[]>([]);

// 是否开启在线服务
const useOnlineService = ref(settingStore.useOnlineService);

// 全局主题色配置
const themeColorOptions = computed(() => {
  return [
    // { label: "关闭主题色", value: "close" },
    ...Object.keys(themeColor).map((key) => ({
      value: key,
      label: t(`setting.general.theme_color_value_${key}`),
      style: {
        color: themeColor[key].color,
      },
    })),
  ];
});

const languageOptions: SelectOption[] = [
  // { label: "跟随系统", value: "auth" },
  { label: "简体中文", value: "zh-CN" },
  { label: "English", value: "en" },
];

// 关闭任务栏进度
const closeTaskbarProgress = (val: boolean) => {
  if (!val) window.electron.ipcRenderer.send("set-bar", "none");
};

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
  // 添加默认选项
  allFontsData.value.unshift({
    label: t("common.system_default"),
    value: "default",
    style: {
      fontFamily:
        "v-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
  });
};

// 在线模式切换
const modeChange = (val: boolean) => {
  if (val) {
    window.$dialog.warning({
      title: t("modal.open_online_service"),
      content: t("modal.open_online_service_tip"),
      positiveText: t("common.ok"),
      negativeText: t("common.cancel"),
      onPositiveClick: () => {
        useOnlineService.value = true;
        settingStore.useOnlineService = true;
      },
    });
  } else {
    window.$dialog.warning({
      title: t("modal.close_online_service"),
      content: t("modal.close_online_service_tip"),
      positiveText: t("common.ok"),
      negativeText: t("common.cancel"),
      onPositiveClick: () => {
        useOnlineService.value = false;
        settingStore.useOnlineService = false;
        // 重启
        window.electron.ipcRenderer.send("win-reload");
      },
      onNegativeClick: () => {
        useOnlineService.value = true;
        settingStore.useOnlineService = true;
      },
    });
  }
};

// 全局着色更改
const themeGlobalColorChange = (val: boolean) => {
  if (val) player.getCoverColor(musicStore.songCover);
};

onMounted(() => {
  if (isElectron) {
    getAllSystemFonts();
  }
});
</script>
