import { LyricLine, LyricWord, parseLrc } from "@applemusic-like-lyrics/lyric";
import { keywords } from "@/assets/data/exclude";
import { LyricType } from "@/types/main";
import { useMusicStore } from "@/stores";
import { msToS } from "./time";

// 恢复默认
export const resetSongLyric = () => {
  const musicStore = useMusicStore();
  musicStore.songLyric = {
    lrcData: [],
    lrcAMData: [],
    yrcData: [],
    yrcAMData: [],
  };
};

// 解析歌词数据
export const parsedLyricsData = (lyricData: any) => {
  const musicStore = useMusicStore();
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
  lrcData = parseLrcData(lrcParseData);

  // 逐字歌词
  if (wordTimestampRegex.test(lyricData.lyric)) {
    // 普通歌词
    yrcParseData = parseFontLyric(lyricData).line;
    yrcData = parseYrcData(yrcParseData);
  }

  musicStore.songLyric = {
    lrcData,
    yrcData,
    lrcAMData: lrcParseData,
    yrcAMData: yrcParseData,
  };
};

// 解析普通歌词
export const parseLrcData = (lrcData: LyricLine[]): LyricType[] => {
  if (!lrcData) return [];
  // 数据处理
  const lrcList = lrcData
    .map((line): LyricType | null => {
      const words = line.words;
      const time = msToS(words[0].startTime);
      const content = words[0].word.trim();
      // 排除内容
      if (!content || keywords.some((keyword) => content.includes(keyword))) {
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
export const parseYrcData = (yrcData: LyricLine[]): LyricType[] => {
  if (!yrcData) return [];
  // 数据处理
  const yrcList = yrcData
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
      if (!contentStr || keywords.some((keyword) => contentStr.includes(keyword))) {
        return null;
      }
      return {
        time,
        endTime,
        content: contentStr,
        contents,
        tran: line.translatedLyric,
        roma: line.romanLyric,
      };
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

// 处理本地歌词
export const parseLocalLyric = (lyric: string) => {
  if (!lyric) {
    resetSongLyric();
    return;
  }
  const musicStore = useMusicStore();
  // 解析
  const lrc: LyricLine[] = parseLrc(lyric);
  const lrcData: LyricType[] = parseLrcData(lrc);
  // 处理结果
  const lrcDataParsed: LyricType[] = [];
  // 翻译提取
  for (let i = 0; i < lrcData.length; i++) {
    // 当前歌词
    const lrcItem = lrcData[i];
    // 是否具有翻译
    const existingObj = lrcDataParsed.find((v) => v.time === lrcItem.time);
    if (existingObj) {
      existingObj.tran = lrcItem.content;
    } else {
      lrcDataParsed.push(lrcItem);
    }
  }
  // 更新歌词
  musicStore.songLyric = {
    lrcData: lrcDataParsed,
    lrcAMData: lrcDataParsed.map((line, index, lines) => ({
      words: [{ startTime: line.time, endTime: 0, word: line.content }],
      startTime: line.time * 1000,
      endTime: lines[index + 1]?.time * 1000,
      translatedLyric: line.tran ?? "",
      romanLyric: line.roma ?? "",
      isBG: false,
      isDuet: false,
    })),
    yrcData: [],
    yrcAMData: [],
  };
};

// 处理 AM 歌词
const wordTimestampRegex = /<\d+,\d+>/g;
const wordLineRegex = /<(?<begin>\d+),(?<end>\d+)>(?<word>.*?)(?=<\d+,\d+>|$)/g;

// regexr.com/6e52n
const extractLrcRegex = /^(?<lyricTimestamps>(?:\[.+?\])+)(?!\[)(?<content>.+)$/gm;
const extractTimestampRegex = /\[(?<min>\d+):(?<sec>\d+)(?:\.|:)*(?<ms>\d+)*\]/g;

export const parseLyric = ({ lyric, spelling, trans }) => {
  if (!wordTimestampRegex.test(lyric)) {
    return parseLineLyric({ lyric, spelling, trans });
  }
  return parseFontLyric({ lyric, spelling, trans });
};

export const parseFontLyric = ({ lyric, spelling, trans }) => {
  const parsedLyrics: LyricLine[] = [];

  const lyrics = parse(lyric);
  const spells = parse(spelling);
  const transLyrics = parse(trans);

  for (const { rawTime, time, content } of lyrics) {
    // content
    // <0,648>Love<648,162> <810,810>Story<1620,162> <1782,162>-<1944,162> <2106,972>Taylor<3078,162> <3240,810>
    const words: LyricWord[] = [];
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

export const parseLineLyric = ({ lyric, spelling, trans }) => {
  lyric = lyric.replace(wordTimestampRegex, "");
  const parsedLyrics: LyricLine[] = [];

  const lyrics = parse(lyric);
  const spells = parse(spelling);
  const transLyrics = parse(trans);

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
        transLyrics.find(({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime)?.content || "",
      romanLyric:
        spells.find(({ rawTime: sLyricRawTime }) => sLyricRawTime === rawTime)?.content || "",
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

  parsedLyrics[parsedLyrics.length - 1].endTime = Infinity;
  parsedLyrics[parsedLyrics.length - 1].words[0].endTime = Infinity;

  return { line: parsedLyrics, metadata: {} };
};

function trimContent(content: string) {
  const t = content.trim();
  return t.length < 1 ? content : t;
}

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
        return mid;
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
      const time = (Number(min) * 60 + Number(sec)) * 1000 + Number(ms ?? 0);

      const parsedLyric = { rawTime, time, content: trimContent(content) };
      parsedLyrics.splice(binarySearch(parsedLyric), 0, parsedLyric);
    }
  }

  return parsedLyrics;
};
