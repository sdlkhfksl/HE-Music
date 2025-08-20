<!-- 本地设置 -->
<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.local.local_music") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.show_local_cover") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.show_local_cover_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showLocalCover" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.show_default_local_path") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.showDefaultLocalPath" class="set" :round="false" />
      </n-card>
      <n-card id="local-list-choose" class="set-item" content-style="flex-direction: column">
        <n-flex justify="space-between">
          <div class="label">
            <n-text class="name">
              {{ t("setting.local.local_files_path") }}
            </n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.local.local_files_path_tip") }}
            </n-text>
          </div>
          <n-button strong secondary @click="changeLocalPath()">
            <template #icon>
              <SvgIcon name="Folder" />
            </template>
            {{ t("common.change") }}
          </n-button>
        </n-flex>
        <n-collapse-transition :show="settingStore.localFilesPath.length > 0">
          <n-card
            v-for="(item, index) in settingStore.localFilesPath"
            :key="index"
            class="set-item"
          >
            <div class="label">
              <n-text class="name">
                {{ item }}
              </n-text>
            </div>
            <n-button strong secondary @click="changeLocalPath(index)">
              <template #icon>
                <SvgIcon name="Delete" />
              </template>
            </n-button>
          </n-card>
        </n-collapse-transition>
      </n-card>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.local.download_config") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.default_download_path") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ settingStore.downloadPath || t("setting.local.default_download_path_empty") }}
          </n-text>
        </div>
        <n-flex>
          <Transition name="fade" mode="out-in">
            <n-button
              v-if="settingStore.downloadPath"
              type="primary"
              strong
              secondary
              @click="settingStore.downloadPath = ''"
            >
              {{ t("common.clear_select") }}
            </n-button>
          </Transition>
          <n-button strong secondary @click="choosePath">
            <template #icon>
              <SvgIcon name="Folder" />
            </template>
            {{ t("common.change") }}
          </n-button>
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.download_song_meta") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.download_song_meta_tip") }}
          </n-text>
        </div>
        <n-switch v-model:value="settingStore.downloadMeta" class="set" :round="false" />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.download_song_cover") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.download_song_cover_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.downloadCover"
          :disabled="!settingStore.downloadMeta"
          :round="false"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.download_song_lyric") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.download_song_lyric_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.downloadLyric"
          :disabled="!settingStore.downloadMeta"
          :round="false"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.download_song_lyric_trans") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.download_song_lyric_trans_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.downloadLyricTran"
          :disabled="!settingStore.downloadMeta || !settingStore.downloadLyric"
          :round="false"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.download_song_lyric_roma") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.download_song_lyric_roma_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.downloadLyricRoma"
          :disabled="!settingStore.downloadMeta || !settingStore.downloadLyric"
          :round="false"
          class="set"
        />
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.local.save_song_meta_file") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.local.save_song_meta_file_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="settingStore.saveMetaFile"
          :disabled="!settingStore.downloadMeta"
          :round="false"
          class="set"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores";
import { changeLocalPath } from "@/utils/helper";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const settingStore = useSettingStore();

// 选择下载路径
const choosePath = async () => {
  const path = await window.electron.ipcRenderer.invoke("choose-path");
  if (path) settingStore.downloadPath = path;
};
</script>

<style lang="scss" scoped>
#local-list-choose {
  .n-flex {
    width: 100%;
  }
  .n-collapse-transition {
    margin-top: 12px;
  }
}
</style>
