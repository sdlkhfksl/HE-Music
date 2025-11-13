import { LyricLine, LyricWord, TTMLLyric } from "@applemusic-like-lyrics/lyric";
import { LyricContentType, LyricType } from "@/types/main";
import { useMusicStore, useSettingStore, useStatusStore } from "@/stores";
import { msToS } from "./time";

export const transSeparator = "[lang:trans]";
export const romaSeparator = "[lang:roma]";

/** 获取排除关键词 */
const getExcludeKeywords = (): string[] => {
  const settingStore = useSettingStore();
  if (!settingStore.enableLyricsExclude) return [];
  return settingStore.lyricsExcludeKeywords;
};

/** 获取排除正则表达式 */
const getExcludeRegexes = (): RegExp[] => {
  const settingStore = useSettingStore();
  if (!settingStore.enableLyricsExclude) return [];
  return settingStore.lyricsExcludeRegexes.map((regex) => new RegExp(regex));
};

/**
 * 检测歌词是否排除
 * @param line 歌词行
 * @returns 是否排除
 */
const isLyricExcluded = (line: string): boolean => {
  const settingStore = useSettingStore();

  if (!settingStore.enableLyricsExclude) {
    return false;
  }
  const excludeKeywords = getExcludeKeywords();
  const excludeRegexes = getExcludeRegexes();
  return (
    excludeKeywords.some((keyword) => line.includes(keyword)) ||
    excludeRegexes.some((regex) => regex.test(line))
  );
};

// 恢复默认
export const resetSongLyric = () => {
  const musicStore = useMusicStore();
  const statusStore = useStatusStore();
  // 重置歌词数据
  musicStore.setSongLyric({}, true);
  // 标记为加载中（切歌时防止显示上一首歌词）
  statusStore.lyricLoading = true;
  // 重置歌词索引
  statusStore.lyricIndex = -1;
};

// 解析歌词数据
export const parsedLyricsData = (lyricData: any, skipExclude: boolean = false) => {
  const musicStore = useMusicStore();
  const statusStore = useStatusStore();
  if (!lyricData.lyric) {
    resetSongLyric();
    return;
  }
  let lrcData: LyricType[] = [];
  let yrcData: LyricType[] = [];
  // 处理后歌词
  let lrcParseData: LyricLine[] = [];
  let yrcParseData: LyricLine[] = [];

  // 普通歌词
  lrcParseData = parseLineLyric(lyricData).line;
  lrcData = parseLrcData(lrcParseData, skipExclude);

  // 逐字歌词
  if (wordTimestampRegex.test(lyricData.lyric)) {
    // 普通歌词
    yrcParseData = parseWordLyric(lyricData).line;
    yrcData = parseYrcData(yrcParseData, skipExclude);
  }

  musicStore.setSongLyric(
    {
      lrcData,
      yrcData,
      lrcAMData: lrcParseData,
      yrcAMData: yrcParseData,
    },
    true,
  );

  // 重置歌词索引
  statusStore.lyricIndex = -1;
  // 歌词已加载完成
  statusStore.lyricLoading = false;
};

// 解析普通歌词
export const parseLrcData = (lrcData: LyricLine[], skipExclude: boolean = false): LyricType[] => {
  if (!lrcData) return [];
  // 数据处理
  const lrcList = lrcData
    .map((line): LyricType | null => {
      const words = line.words;
      const time = msToS(words[0].startTime);
      const content = words[0].word.trim();
      // 排除内容
      if (!content || (!skipExclude && isLyricExcluded(content))) {
        return null;
      }
      return {
        time,
        content,
        tran: line.translatedLyric,
        roma: line.romanLyric,
        endTime: 0,
        contents: [],
      };
    })
    .filter((line): line is LyricType => line !== null);
  // 筛选出非空数据并返回
  return lrcList;
};

// 解析逐字歌词
export const parseYrcData = (yrcData: LyricLine[], skipExclude: boolean = false): LyricType[] => {
  if (!yrcData) return [];
  // 数据处理
  const yrcList = yrcData
    .map((line) => {
      const words = line.words;
      const time = msToS(words[0]?.startTime);
      const endTime = msToS(words[words.length - 1]?.endTime);
      const contents: LyricContentType[] = words.map((word) => {
        return {
          time: msToS(word.startTime),
          endTime: msToS(word.endTime),
          duration: msToS(word.endTime - word.startTime),
          content: word.word.trim(),
          endsWithSpace: word.word.endsWith(" "),
        };
      });
      // 完整歌词
      const contentStr = contents
        .map((word) => word.content + (word.endsWithSpace ? " " : ""))
        .join("");
      // 排除内容
      if (!contentStr || (!skipExclude && isLyricExcluded(contentStr))) {
        return null;
      }
      return {
        time,
        endTime,
        content: contentStr,
        contents,
        tran: line.translatedLyric,
        roma: line.romanLyric,
      } as LyricType;
    })
    .filter((line): line is LyricType => line !== null);
  return yrcList;
};

// 歌词内容对齐
export const alignLyrics = (
  lyrics: LyricType[],
  otherLyrics: LyricType[],
  key: "tran" | "roma",
): LyricType[] => {
  const lyricsData = lyrics;
  if (lyricsData.length && otherLyrics.length) {
    lyricsData.forEach((v: LyricType) => {
      otherLyrics.forEach((x: LyricType) => {
        if (v.time === x.time || Math.abs(v.time - x.time) < 0.6) {
          v[key] = x.content;
        }
      });
    });
  }
  return lyricsData;
};

/**
 * 对齐AM歌词
 * @param lyrics 歌词数据
 * @param otherLyrics 其他歌词数据
 * @param key 对齐类型
 * @returns 对齐后的歌词数据
 */
export const alignAMLyrics = (
  lyrics: LyricLine[],
  otherLyrics: LyricLine[],
  key: "translatedLyric" | "romanLyric",
): LyricLine[] => {
  const lyricsData = lyrics;
  if (lyricsData.length && otherLyrics.length) {
    lyricsData.forEach((v: LyricLine) => {
      otherLyrics.forEach((x: LyricLine) => {
        if (v.startTime === x.startTime || Math.abs(v.startTime - x.startTime) < 0.6) {
          v[key] = x.words.map((word) => word.word).join("");
        }
      });
    });
  }
  return lyricsData;
};

const splitLocalLyrics = (text: string) => {
  // 获取标签位置（兼容不存在的情况）
  const transIndex = text.indexOf(transSeparator);
  const romaIndex = text.indexOf(romaSeparator);

  // 提取原文（标签之前的内容）
  const lyric = text
    .slice(
      0,
      Math.min(transIndex >= 0 ? transIndex : Infinity, romaIndex >= 0 ? romaIndex : Infinity),
    )
    .trim();

  // 动态提取翻译和罗马音（顺序无关）
  let trans = "",
    roma = "";
  if (transIndex >= 0) {
    const transEnd = text.indexOf(romaSeparator, transIndex + transSeparator.length);
    trans = text
      .slice(
        transIndex + transSeparator.length,
        transEnd >= 0 && transEnd > transIndex ? transEnd : undefined, // 确保结束位置在翻译标签之后
      )
      .trim();
  }
  if (romaIndex >= 0) {
    const romaEnd = text.indexOf(transSeparator, romaIndex + romaSeparator.length);
    roma = text
      .slice(
        romaIndex + romaSeparator.length,
        romaEnd >= 0 && romaEnd > romaIndex ? romaEnd : undefined, // 确保结束位置在罗马音标签之后
      )
      .trim();
  }

  return { lyric, trans, roma };
};

// 处理本地歌词
export const parseLocalLyric = (lyric: string) => {
  if (!lyric) {
    resetSongLyric();
    return;
  }

  const musicStore = useMusicStore();
  const statusStore = useStatusStore();
  const settingStore = useSettingStore();

  const splitLyric = splitLocalLyrics(lyric);

  // 解析
  const lrc: LyricLine[] = parseLineLyric(splitLyric).line;
  const lrcData: LyricType[] = parseLrcData(lrc, !settingStore.enableLocalLyricsExclude);

  // 更新歌词
  musicStore.setSongLyric(
    {
      lrcData: lrcData,
      lrcAMData: lrc,
      yrcData: [],
      yrcAMData: [],
    },
    true,
  );
  // 重置歌词索引
  statusStore.lyricIndex = -1;
  // 歌词已加载完成
  statusStore.lyricLoading = false;
};

// 处理 AM 歌词
const wordTimestampRegex = /<\d+,\d+>/g;
const wordLineRegex = /<(?<begin>\d+),(?<end>\d+)>(?<word>.*?)(?=<\d+,\d+>|$)/g;

// regexr.com/6e52n
const extractLrcRegex = /^(?<lyricTimestamps>(?:\[.+?\])+)(?!\[)(?<content>.+)$/gm;
const extractTimestampRegex = /\[(?<min>\d+):(?<sec>\d+)(?:\.|:)*(?<ms>\d+)*\]/g;

export const parseLyric = ({ lyric, roma, trans }) => {
  if (!wordTimestampRegex.test(lyric)) {
    return parseLineLyric({ lyric, roma, trans });
  }
  return parseWordLyric({ lyric, roma, trans });
};

export const parseWordLyric = ({ lyric = "", roma = "", trans = "" }) => {
  const parsedLyrics: LyricLine[] = [];

  const lyrics = parse(lyric);
  const spells = parse(removeWordLyric(roma));
  const transLyrics = parse(removeWordLyric(trans));

  for (const { rawTime, time, content } of lyrics) {
    // content
    // <0,648>Love<648,162> <810,810>Story<1620,162> <1782,162>-<1944,162> <2106,972>Taylor<3078,162> <3240,810>
    const words: LyricWord[] = [];

    wordLineRegex.lastIndex = 0;
    if (!wordLineRegex.test(content)) {
      words.push({
        startTime: time,
        endTime: time,
        word: content,
      });
    } else {
      wordLineRegex.lastIndex = 0;
      for (const line of content.matchAll(wordLineRegex)) {
        if (!line.groups) continue;
        const { begin, end, word } = line.groups as {
          begin: string;
          end: string;
          word: string;
        };
        // console.log("begin:",begin,"end:", end,"word:", word)
        words.push({
          startTime: time + parseInt(begin),
          endTime: time + parseInt(begin) + parseInt(end),
          word: word,
        });
      }
    }

    const lrc: LyricLine = {
      words: words,
      translatedLyric:
        transLyrics.find(({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime)?.content || "",
      romanLyric:
        spells.find(({ rawTime: sLyricRawTime }) => sLyricRawTime === rawTime)?.content || "",
      startTime: time,
      endTime: words[words.length - 1]?.endTime || 0,
      isBG: false,
      isDuet: false,
    };

    if (parsedLyrics[parsedLyrics.length - 1]?.endTime === 0) {
      parsedLyrics[parsedLyrics.length - 1].endTime = time;
    }
    parsedLyrics.push(lrc);
  }

  return { line: parsedLyrics, metadata: {} };
};

export const removeWordLyric = (str: string) => {
  return str.replace(wordTimestampRegex, "");
};

export const parseLineLyric = ({ lyric = "", roma = "", trans = "" }) => {
  const parsedLyrics: LyricLine[] = [];

  const lyrics = parse(removeWordLyric(lyric));
  const spells = parse(removeWordLyric(roma));
  const transLyrics = parse(removeWordLyric(trans));

  for (const { rawTime, time, content } of lyrics) {
    const lrc: LyricLine = {
      words: [
        {
          startTime: time,
          endTime: 0,
          word: content,
        },
      ],
      translatedLyric:
        transLyrics.find(
          ({ rawTime: tRawTime, time: tTime }) => tRawTime === rawTime || tTime === time,
        )?.content || "",
      romanLyric:
        spells.find(({ rawTime: tRawTime, time: tTime }) => tRawTime === rawTime || tTime === time)
          ?.content || "",
      startTime: time,
      endTime: 0,
      isBG: false,
      isDuet: false,
    };

    if (parsedLyrics[parsedLyrics.length - 1]) {
      parsedLyrics[parsedLyrics.length - 1].endTime = time;
      parsedLyrics[parsedLyrics.length - 1].words[0].endTime = time;
    }
    parsedLyrics.push(lrc);
  }
  if (parsedLyrics[parsedLyrics.length - 1]) {
    parsedLyrics[parsedLyrics.length - 1].endTime = Infinity;
    parsedLyrics[parsedLyrics.length - 1].words[0].endTime = Infinity;
  }

  return { line: parsedLyrics, metadata: {} };
};

const trimContent = (content: string) => {
  const t = content.trim();
  return t.length < 1 ? content : t;
};

const parse = (lrc: string) => {
  const parsedLyrics: { rawTime: string; time: number; content: string }[] = [];

  const binarySearch = (lyric) => {
    const time = lyric.time;

    let low = 0;
    let high = parsedLyrics.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = parsedLyrics[mid].time;
      if (midTime === time) {
        low = mid + 1;
      } else if (midTime < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return low;
  };

  for (const line of lrc.trim().matchAll(extractLrcRegex)) {
    if (!line.groups) continue;
    const { lyricTimestamps, content } = line.groups as {
      lyricTimestamps: string;
      content: string;
    };

    for (const timestamp of lyricTimestamps.matchAll(extractTimestampRegex)) {
      if (!timestamp.groups) continue;
      const { min, sec, ms } = timestamp.groups as { min: string; sec: string; ms: string };
      const rawTime = timestamp[0];
      const mss = ms?.length == 3 ? ms : ms + "0"; // .02 => .020
      const time = (Number(min) * 60 + Number(sec)) * 1000 + Number(mss ?? 0);

      const parsedLyric = { rawTime, time, content: trimContent(content) };
      parsedLyrics.splice(binarySearch(parsedLyric), 0, parsedLyric);
    }
  }

  return parsedLyrics;
};

/**
 * 从TTML格式解析歌词并转换为AMLL格式
 * @param ttmlContent TTML格式的歌词内容
 * @param skipExclude 是否跳过排除
 * @returns AMLL格式的歌词行数组
 */
export const parseTTMLToAMLL = (
  ttmlContent: TTMLLyric,
  skipExclude: boolean = false,
): LyricLine[] => {
  if (!ttmlContent) return [];

  try {
    const validLines = ttmlContent.lines
      .filter((line) => line && typeof line === "object" && Array.isArray(line.words))
      .map((line) => {
        const words = line.words
          .filter((word) => word && typeof word === "object")
          .map((word) => ({
            word: String(word.word || " "),
            startTime: Number(word.startTime) || 0,
            endTime: Number(word.endTime) || 0,
          }));

        if (!words.length) return null;

        // 获取歌词文本内容
        const content = words
          .map((word) => word.word)
          .join("")
          .trim();
        // 排除包含关键词的内容
        if (!content || (!skipExclude && isLyricExcluded(content))) {
          return null;
        }

        const startTime = line.startTime || words[0].startTime;
        const endTime = line.endTime || words[words.length - 1].endTime;

        return {
          words,
          startTime,
          endTime,
          translatedLyric: String(line.translatedLyric || ""),
          romanLyric: String(line.romanLyric || ""),
          isBG: Boolean(line.isBG),
          isDuet: Boolean(line.isDuet),
        };
      })
      .filter((line): line is LyricLine => line !== null);

    return validLines;
  } catch (error) {
    console.error("TTML parsing error:", error);
    return [];
  }
};

/**
 * 从TTML格式解析歌词并转换为默认Yrc格式
 * @param ttmlContent TTML格式的歌词内容
 * @param skipExclude 是否跳过排除
 * @returns 默认Yrc格式的歌词行数组
 */
export const parseTTMLToYrc = (
  ttmlContent: TTMLLyric,
  skipExclude: boolean = false,
): LyricType[] => {
  if (!ttmlContent) return [];

  try {
    // 数据处理
    const yrcList = ttmlContent.lines
      .map((line) => {
        const words = line.words;
        const time = msToS(words[0].startTime);
        const endTime = msToS(words[words.length - 1].endTime);
        const contents = words.map((word) => {
          return {
            time: msToS(word.startTime),
            endTime: msToS(word.endTime),
            duration: msToS(word.endTime - word.startTime),
            content: word.word.trim(),
            endsWithSpace: word.word.endsWith(" "),
          };
        });
        // 完整歌词
        const contentStr = contents
          .map((word) => word.content + (word.endsWithSpace ? " " : ""))
          .join("");
        // 排除内容
        if (!contentStr || (!skipExclude && isLyricExcluded(contentStr))) {
          return null;
        }
        return {
          time,
          endTime,
          content: contentStr,
          contents,
          tran: line.translatedLyric || "",
          roma: line.romanLyric || "",
          isBG: line.isBG,
          isDuet: line.isDuet,
        };
      })
      .filter((line) => line !== null);
    return yrcList;
  } catch (error) {
    console.error("TTML parsing to yrc error:", error);
    return [];
  }
};

// 检测语言
export const getLyricLanguage = (lyric: string): string => {
  // 判断日语 根据平假名和片假名
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(lyric)) return "ja";
  // 判断简体中文 根据中日韩统一表意文字基本区
  if (/[\u4e00-\u9fa5]/.test(lyric)) return "zh-CN";
  // 默认英语
  return "en";
};

/**
 * 计算歌词索引
 * - 普通歌词(LRC)：沿用当前按开始时间定位的算法
 * - 逐字歌词(YRC)：当播放时间位于某句 [time, endTime) 区间内时，索引为该句；
 *   若下一句开始时间落在上一句区间（对唱重叠），仍保持上一句索引，直到上一句结束。
 */
export const calculateLyricIndex = (currentTime: number): number => {
  const musicStore = useMusicStore();
  const statusStore = useStatusStore();
  const settingStore = useSettingStore();
  // 应用实时偏移（按歌曲 id 记忆） + 0.3s（解决对唱时歌词延迟问题）
  const playSeek = currentTime + statusStore.getSongOffset(musicStore.playSong) + 0.3;
  // 选择歌词类型
  const useYrc = !!(settingStore.showYrc && musicStore.songLyric.yrcData.length);
  const lyrics = useYrc ? musicStore.songLyric.yrcData : musicStore.songLyric.lrcData;
  // 无歌词时
  if (!lyrics || !lyrics.length) return -1;

  // 普通歌词：保持原有计算方式
  if (!useYrc) {
    const idx = lyrics.findIndex((v) => (v?.time ?? 0) >= playSeek);
    const index = idx === -1 ? lyrics.length - 1 : idx - 1;
    return index;
  }

  // 逐字歌词（并发最多三句同时存在）：
  // - 计算在播放进度下处于激活区间的句子集合 activeIndices（[time, endTime)）
  // - 若激活数 >= 3，仅保留最后三句作为并发显示（允许三句同时有效）；否则保持最后两句
  // - 索引取该并发集合中较早的一句（保持“上一句”高亮）
  // - 若无激活句：首句之前返回 -1；否则回退到最近一句

  const firstStart = lyrics[0]?.time ?? 0;
  if (playSeek < firstStart) {
    return -1;
  }

  const activeIndices: number[] = [];
  for (let i = 0; i < lyrics.length; i++) {
    const start = lyrics[i]?.time ?? 0;
    const end = lyrics[i]?.endTime ?? Infinity;
    if (playSeek >= start && playSeek < end) {
      activeIndices.push(i);
    }
  }

  if (activeIndices.length === 0) {
    // 不在任何句子的区间里：退回到最近一句（按开始时间）
    const nextIdx = lyrics.findIndex((v) => (v?.time ?? 0) > playSeek);
    const index = nextIdx === -1 ? lyrics.length - 1 : nextIdx - 1;
    return index;
  }

  if (activeIndices.length === 1) {
    return activeIndices[0];
  }

  // 激活句 >= 2：如果达到三句或更多，限制为最后三句并发；否则保持最后两句
  const concurrent = activeIndices.length >= 3 ? activeIndices.slice(-3) : activeIndices.slice(-2);
  return concurrent[0];
};
