<template>
  <div class="top-list">
    <n-tabs
      class="tabs"
      type="bar"
      animated
      v-model:value="platform"
      @update:value="platformChange"
    >
      <n-tab-pane
        v-for="platform in supportPlatforms"
        :key="`discover-playlists-${platform.id}`"
        :name="platform.id"
        :tab="platform.shortname"
        :disabled="platform.status !== 1"
        display-directive="show:lazy"
      >
        <TopListResult :platform="platform.id" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import TopListResult from "@/views/TopList/TopListResult.vue";
import { usePlatformStore } from "@/stores";
import { onBeforeRouteUpdate } from "vue-router";
import { FeatureSupportFlag } from "@/api/platform";
import { computed, onMounted } from "vue";
import { PlatformInfo } from "@/types/main.hemusic";

const router = useRouter();
const platformStore = usePlatformStore();
const supportPlatforms = computed<PlatformInfo[]>(
  () => platformStore.featureSupportList(FeatureSupportFlag.GetTopList) || [],
);

// 搜索分类
const platform = computed<string>(() => router.currentRoute.value.query.platform as string);

const platformChange = (value: string) => {
  router.replace({
    name: "top-list",
    query: {
      platform: value,
    },
  });
};

onBeforeRouteUpdate((to) => {
  let targetPlatform = to.query.platform as string;
  if (
    supportPlatforms.value.length > 0 &&
    !supportPlatforms.value.find((p) => p.id === targetPlatform && p.status === 1)
  ) {
    platformChange(supportPlatforms.value[0]?.id || "");
  }
});

onMounted(() => {
  if (
    supportPlatforms.value.length > 0 &&
    !supportPlatforms.value.find((p) => p.id === platform.value && p.status === 1)
  ) {
    platformChange(supportPlatforms.value[0]?.id || "");
  }
});
</script>

<style lang="scss" scoped>
.top-list {
  display: flex;
  flex-direction: column;
}
</style>
