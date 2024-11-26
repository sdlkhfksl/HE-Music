<template>
  <div class="home">
    <n-tabs
      v-if="settingStore.useOnlineService"
      class="tabs"
      type="bar"
      animated
      v-model:value="platform"
      @update:value="platformChange"
    >
      <n-tab-pane
        v-for="platform in supportPlatforms"
        :key="`discover-${platform.id}`"
        :name="platform.id"
        :tab="platform.shortname"
        :disabled="platform.status !== 1"
        display-directive="show:lazy"
      >
        <HomeOnline :platform="platform.id" />
      </n-tab-pane>
    </n-tabs>
    <!-- 在线模式 -->
    <!-- 本地模式 -->
    <HomeLocal v-else />
  </div>
</template>

<script setup lang="ts">
import { usePlatformStore, useSettingStore } from "@/stores";
import HomeOnline from "./HomeOnline.vue";
import HomeLocal from "./HomeLocal.vue";
import { FeatureSupportFlag } from "@/api/platform";
import { computed, onMounted } from "vue";

const settingStore = useSettingStore();
const router = useRouter();
const platformStore = usePlatformStore();

const supportPlatforms = platformStore.featureSupportList(FeatureSupportFlag.GetDiscoverPage) || [];

// 搜索分类
const platform = computed<string>(() => router.currentRoute.value.query.platform as string);

const platformChange = (value: string) => {
  console.log("platformChange", value);
  router.push({
    name: "discover",
    query: {
      platform: value,
    },
  });
};

onBeforeRouteUpdate((to) => {
  let targetPlatform = to.query.platform as string;
  if (
    supportPlatforms.length > 0 &&
    !supportPlatforms.find((p) => p.id === targetPlatform && p.status === 1)
  ) {
    platformChange(supportPlatforms[0]?.id);
  }
});

onMounted(() => {
  if (
    supportPlatforms.length > 0 &&
    !supportPlatforms.find((p) => p.id === platform.value && p.status === 1)
  ) {
    platformChange(supportPlatforms[0]?.id);
  }
});
</script>

<style lang="scss" scoped>
.home {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
}
</style>
