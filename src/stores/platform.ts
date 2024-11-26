import { PlatformInfo } from "@/types/main.hemusic";
import { defineStore } from "pinia";
import { platforms } from "@/api/platform";

interface PlatformData {
  platforms: PlatformInfo[];
}

export const usePlatformStore = defineStore({
  id: "platform",
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
  },
});
