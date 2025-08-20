<template>
  <div class="exclude">
    <n-alert :show-icon="false">
      {{ t("setting.lyrics.lyrics_exclude_warning") }}
    </n-alert>
    <n-dynamic-tags v-model:value="settingStore.lyricExcludeKeywords" />
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const settingStore = useSettingStore();
</script>

<style lang="scss" scoped>
.exclude {
  .n-alert {
    margin-bottom: 20px;
  }
}
</style>
