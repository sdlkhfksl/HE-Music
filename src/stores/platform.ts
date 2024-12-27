import { PlatformInfo } from "@/types/main.hemusic";
import { defineStore } from "pinia";
import { platforms } from "@/api/platform";

interface PlatformData {
  platforms: PlatformInfo[];
}

export const usePlatformStore = defineStore("platform", {
  state: (): PlatformData => ({
    platforms: [],
  }),

  getters: {
    featureSupportList: (state) => (flag) =>
      state.platforms.filter((item) => item.feature_support_flag & flag),
  },
  actions: {
    async loadPlatforms() {
      if (this.platforms.length) return;
      const res = await platforms();
      this.platforms = res.list.map((item) => {
        return {
          ...item,
          feature_support_flag: BigInt(item.feature_support_flag),
        };
      });
    },
    isFeatureSupport(platform: string, flag: bigint) {
      const platformInfo = this.platforms.find((item) => item.id === platform);
      if (!platformInfo) return false;
      return !!(platformInfo.feature_support_flag & flag);
    },
    getPlatformInfo(platform: string) {
      return this.platforms.find((item) => item.id === platform);
    },
  },
});
