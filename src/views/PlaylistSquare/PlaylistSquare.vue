<template>
  <div class="playlist-square">
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
        <PlaylistSquareResult
          :platform="platform.id"
          v-model:tag_id="tag_id"
          @update:tag_id="tagChange"
        />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { usePlatformStore } from "@/stores";
import { onBeforeRouteUpdate } from "vue-router";
import PlaylistSquareResult from "@/views/PlaylistSquare/PlaylistSquareResult.vue";
import { computed, onActivated, onMounted } from "vue";
import { FeatureSupportFlag } from "@/api/platform";
import { PlatformInfo } from "@/types/main.hemusic";

const router = useRouter();
const platformStore = usePlatformStore();
const supportPlatforms = computed<PlatformInfo[]>(
  () => platformStore.featureSupportList(FeatureSupportFlag.GetTagList) || [],
);
// 搜索分类
const platform = computed<string>(() => router.currentRoute.value.query.platform as string);
const tag_id = computed<string>(() => router.currentRoute.value.query.tag_id as string);

const platformChange = (value: string) => {
  router.replace({
    name: "playlist-square",
    query: {
      platform: value,
    },
  });
};

const tagChange = (tag_id: string) => {
  router.replace({
    name: "playlist-square",
    query: {
      platform: platform.value,
      tag_id: tag_id,
    },
  });
};

onBeforeRouteUpdate((to) => {
  let targetPlatform = to.query.platform as string;
  if (
    supportPlatforms.value.length > 0 &&
    !supportPlatforms.value.find((p) => p.id === targetPlatform && p.status === 1)
  ) {
    platformChange(supportPlatforms.value[0]?.id);
  }
});

onActivated(() => {
  console.log("playlist-square activated", platform.value, tag_id.value);
});

onMounted(() => {
  if (
    supportPlatforms.value.length > 0 &&
    !supportPlatforms.value.find((p) => p.id === platform.value && p.status === 1)
  ) {
    platformChange(supportPlatforms.value[0]?.id);
  }
});
</script>

<style lang="scss" scoped>
.playlist-square {
  display: flex;
  flex-direction: column;
}
</style>
