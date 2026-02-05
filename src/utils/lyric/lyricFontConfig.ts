import { useSettingStore } from "@/stores";

export interface LyricFontConfig {
  keySetting: "lyricFont" | "japaneseLyricFont" | "englishLyricFont" | "koreanLyricFont";
  default: string;
}

export interface LyricLangFontConfig extends LyricFontConfig {
  keyCss: string;
}

export const lyricLangFontConfigs: LyricLangFontConfig[] = [
  {
    keySetting: "englishLyricFont",
    keyCss: "--en-font-family",
    default: "follow",
  },
  {
    keySetting: "japaneseLyricFont",
    keyCss: "--ja-font-family",
    default: "follow",
  },
  {
    keySetting: "koreanLyricFont",
    keyCss: "--ko-font-family",
    default: "follow",
  },
];

export const lyricFontConfigs: LyricFontConfig[] = [
  {
    keySetting: "lyricFont",
    default: "follow",
  },
  ...lyricLangFontConfigs,
];

export const lyricLangFontStyle = (settingStore = useSettingStore()) => {
  return Object.fromEntries(
    lyricLangFontConfigs.map((c) => {
      const settingValue = settingStore[c.keySetting];
      return [c.keyCss, settingValue !== c.default ? settingValue : ""];
    }),
  );
};
