<template>
  <div class="setting">
    <n-tabs
      v-model:value="activeKey"
      class="tabs"
      type="card"
      animated
      default-value="song"
      @update:value="tabChange"
    >
      <n-tab-pane
        name="general"
        :tab="t('setting.general.general_setting')"
        display-directive="show:lazy"
      >
        <!-- 常规 -->
        <GeneralSetting />
      </n-tab-pane>
      <n-tab-pane name="play" :tab="t('setting.play.play_setting')" display-directive="show:lazy">
        <!-- 播放 -->
        <PlaySetting />
      </n-tab-pane>
      <n-tab-pane
        name="lyrics"
        :tab="t('setting.lyrics.lyrics_setting')"
        display-directive="show:lazy"
      >
        <!-- 歌词 -->
        <LyricsSetting />
      </n-tab-pane>
      <n-tab-pane
        v-if="isElectron"
        name="other"
        :tab="t('setting.other.other_setting')"
        display-directive="show:lazy"
      >
        <!-- 快捷键 -->
        <KeyboardSetting />
      </n-tab-pane>
      <n-tab-pane
        v-if="isElectron"
        name="other"
        :tab="t('setting.other.other_setting')"
        display-directive="show:lazy"
      >
        <!-- 本地 -->
        <LocalSetting />
      </n-tab-pane>
      <n-tab-pane
        name="other"
        :tab="t('setting.other.other_setting')"
        display-directive="show:lazy"
      >
        <!-- 本地 -->
        <OtherSetting />
      </n-tab-pane>
      <n-tab-pane name="about" :tab="t('common.about')" display-directive="show:lazy">
        <!-- 关于 -->
        <AboutSetting />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import type { SettingType } from "@/types/main";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { isElectron } from "@/utils/helper";

const { t } = useI18n();
const router = useRouter();

// 菜单数据
const activeKey = computed<SettingType>(
  () => (router.currentRoute.value.query.type as SettingType) || "general",
);

const tabChange = (key: SettingType) => {
  router.push({
    path: "/setting",
    query: {
      type: key,
    },
  });
};
</script>

<style lang="scss" scoped>
.setting {
  display: flex;
  width: 100%;
  overflow: scroll;
  :deep(.n-tabs-pane-wrapper) {
    padding: 0;
    .setting-type {
      transition: opacity 0.2s ease-in-out;
    }
    .set-content {
      flex: 1;
      padding: 0 40px;
      background-color: var(--background-hex);
      // background-color: rgba(var(--surface-container), 0.28);
    }
    .set-list {
      margin-bottom: 30px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .n-collapse-transition {
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .set-item {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 12px;
      transition: margin 0.3s;
      &:last-child {
        margin-bottom: 0;
      }
      .n-card__content {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
      }
      .label {
        display: flex;
        flex-direction: column;
        padding-right: 20px;
        .name {
          font-size: 16px;
        }
      }
      .n-flex {
        flex-flow: nowrap !important;
      }
      .set {
        justify-content: flex-end;
        width: 200px;
        &.n-switch {
          width: max-content;
        }
        @media (max-width: 768px) {
          width: 140px;
          min-width: 140px;
        }
      }
    }
  }
}
</style>
