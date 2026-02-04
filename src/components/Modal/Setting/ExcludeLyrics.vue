<template>
  <div class="exclude-lyrics-modal">
    <n-flex vertical size="large">
      <n-card class="switch-card" size="small">
        <n-flex align="center" justify="space-between">
          <n-text>{{ t("setting.lyrics.lyrics_exclude_online") }}</n-text>
          <n-switch v-model:value="enableOnlineLyricsExclude" :round="false" />
        </n-flex>
      </n-card>
      <n-card class="switch-card" size="small">
        <n-flex align="center" justify="space-between">
          <n-text class="name">{{ t("setting.lyrics.lyrics_exclude_local") }}</n-text>
          <n-switch v-model:value="enableExcludeLocalLyrics" class="set" :round="false" />
        </n-flex>
      </n-card>

      <n-tabs v-model:value="page" animated>
        <n-tab-pane name="keywords" :tab="t('common.keyword')">
          <n-scrollbar style="max-height: 50vh">
            <n-flex vertical :size="12">
              <n-dynamic-tags v-model:value="filterKeywords" />
              <n-button
                v-if="filterKeywords.length"
                type="error"
                secondary
                size="small"
                @click="clearKeywords"
              >
                <template #icon>
                  <SvgIcon name="DeleteSweep" />
                </template>
                {{ t("setting.other.clear_all_data_btn") }}
              </n-button>
            </n-flex>
          </n-scrollbar>
        </n-tab-pane>

        <n-tab-pane name="regexes" :tab="t('common.regex')">
          <n-scrollbar style="max-height: 50vh">
            <n-flex vertical :size="12">
              <n-dynamic-tags v-model:value="filterRegexes" />
              <n-button
                v-if="filterRegexes.length"
                type="error"
                secondary
                size="small"
                @click="clearRegexes"
              >
                <template #icon>
                  <SvgIcon name="DeleteSweep" />
                </template>
                {{ t("setting.other.clear_all_data_btn") }}
              </n-button>
            </n-flex>
          </n-scrollbar>
        </n-tab-pane>
      </n-tabs>

      <n-divider style="margin: 6px 0" />
      <n-flex justify="right">
        <n-flex>
          <n-button @click="handleClose">{{ t("common.cancel") }}</n-button>
          <n-button type="primary" @click="saveFilter">{{ t("common.save") }}</n-button>
        </n-flex>
      </n-flex>
    </n-flex>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["close"]);

const settingStore = useSettingStore();
const { t } = useI18n();

const enableOnlineLyricsExclude = ref(settingStore.enableOnlineLyricsExclude);
const enableExcludeLocalLyrics = ref(settingStore.enableLocalLyricsExclude);

const filterKeywords = ref<string[]>([]);
const filterRegexes = ref<string[]>([]);
const page = ref("keywords");

// 清空关键词
const clearKeywords = () => {
  filterKeywords.value = [];
};

// 清空正则表达式
const clearRegexes = () => {
  filterRegexes.value = [];
};

// 保存过滤
const saveFilter = () => {
  settingStore.enableOnlineLyricsExclude = enableOnlineLyricsExclude.value;
  settingStore.enableLocalLyricsExclude = enableExcludeLocalLyrics.value;
  settingStore.lyricsExcludeKeywords = filterKeywords.value;
  settingStore.lyricsExcludeRegexes = filterRegexes.value;
  handleClose();
};

const handleClose = () => {
  emit("close");
};

onMounted(() => {
  enableOnlineLyricsExclude.value = settingStore.enableOnlineLyricsExclude;
  enableExcludeLocalLyrics.value = settingStore.enableLocalLyricsExclude;
  filterKeywords.value = [...(settingStore.lyricsExcludeKeywords || [])];
  filterRegexes.value = [...(settingStore.lyricsExcludeRegexes || [])];
});
</script>

<style lang="scss" scoped>
.exclude-lyrics-modal {
  padding: 0;
  .switch-card {
    width: 100%;
    border-radius: 8px;
    .n-text {
      font-size: 16px;
    }
  }

  .set-list {
    margin-bottom: 24px;
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
    :deep(.n-card__content) {
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
</style>
