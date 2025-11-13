<template>
  <div class="exclude">
    <n-alert :show-icon="false"> {{ t("setting.lyrics.lyrics_exclude_warning") }}</n-alert>

    <n-tabs type="line" v-model:value="page" animated>
      <n-tab-pane name="keywords" :tab="t('common.keyword')">
        <n-dynamic-tags v-model:value="settingStore.lyricsExcludeKeywords" />
      </n-tab-pane>
      <n-tab-pane name="regexes" :tab="t('common.regex')">
        <n-dynamic-tags v-model:value="settingStore.lyricsExcludeRegexes" />
      </n-tab-pane>

      <template #suffix>
        <n-button type="primary" strong secondary @click="reset">{{
          t("common.reset_default")
        }}</n-button>
      </template>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";
import { keywords, regexes } from "@/assets/data/exclude";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const settingStore = useSettingStore();

const page = ref("keywords");

const reset = () => {
  switch (page.value) {
    case "keywords":
      settingStore.lyricsExcludeKeywords = keywords;
      break;
    case "regexes":
      settingStore.lyricsExcludeRegexes = regexes;
      break;
  }
};
</script>

<style lang="scss" scoped>
.exclude {
  .n-alert {
    margin-bottom: 20px;
  }
}
</style>
