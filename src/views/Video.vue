<!-- 视频 -->
<template>
  <div class="video">
    <!-- 视频信息 -->
    <Transition name="fade" mode="out-in">
      <div v-if="videoData" class="info">
        <n-h2 class="name">
          <n-ellipsis :line-clamp="1" :tooltip="{ placement: 'bottom' }">
            {{ videoData.name || "未知视频" }}
          </n-ellipsis>
        </n-h2>
        <n-flex class="meta" align="center">
          <div class="item">
            <SvgIcon name="Video" :depth="3" />
            <n-text>{{ formatNumber(Number(videoData.play_count) || 0) }}</n-text>
          </div>
          <!--          <div class="item">-->
          <!--            <SvgIcon name="Chat" :depth="3" />-->
          <!--            <n-text>{{ formatNumber(videoData.commentCount || 0) }}</n-text>-->
          <!--          </div>-->
          <!--          <div class="item">-->
          <!--            <SvgIcon name="Time" :depth="3" />-->
          <!--            <n-text>{{ formatTimestamp(videoData.updateTime || videoData.createTime) }}</n-text>-->
          <!--          </div>-->
        </n-flex>
      </div>
      <div v-else class="info">
        <n-skeleton :repeat="2" text round />
      </div>
    </Transition>
    <!-- 视频播放器 -->
    <div class="player" v-visible>
      <Transition name="fade" mode="out-in">
        <video :key="videoData?.id" ref="videoRef" />
      </Transition>
    </div>
    <!-- 菜单 -->
    <!--    <Transition name="fade" mode="out-in">-->
    <!--      <n-flex :key="videoData?.id" class="menu" justify="space-between" align="center">-->
    <!--        <n-flex class="control">-->
    <!--          &lt;!&ndash; 点赞 &ndash;&gt;-->
    <!--          <n-button :focusable="false" quaternary>-->
    <!--            <template #icon>-->
    <!--              <SvgIcon :name="videoData?.liked ? 'ThumbUp' : 'ThumbUpOff'" />-->
    <!--            </template>-->
    <!--            {{ formatNumber(videoData?.likedCount || 0) }}-->
    <!--          </n-button>-->
    <!--          &lt;!&ndash; 收藏 &ndash;&gt;-->
    <!--          <n-button :focusable="false" quaternary>-->
    <!--            <template #icon>-->
    <!--              <SvgIcon name="Favorite" />-->
    <!--              &lt;!&ndash; FavoriteBorder &ndash;&gt;-->
    <!--            </template>-->
    <!--            {{ formatNumber(videoData?.subCount || 0) }}-->
    <!--          </n-button>-->
    <!--          &lt;!&ndash; 分享 &ndash;&gt;-->
    <!--          <n-button :focusable="false" quaternary>-->
    <!--            <template #icon>-->
    <!--              <SvgIcon name="Share" />-->
    <!--              &lt;!&ndash; FavoriteBorder &ndash;&gt;-->
    <!--            </template>-->
    <!--            {{ formatNumber(videoData?.shareCount || 0) }}-->
    <!--          </n-button>-->
    <!--        </n-flex>-->
    <!--      </n-flex>-->
    <!--    </Transition>-->
    <!--     简介及标签-->
    <Transition name="fade" mode="out-in">
      <div v-if="videoData" class="desc">
        <!--        <n-divider />-->
        <!--        <n-ellipsis :line-clamp="3" :tooltip="{ placement: 'bottom', width: 'trigger' }">-->
        <!--          {{ "该视频暂无简介" }}-->
        <!--        </n-ellipsis>-->
        <!--        <n-flex v-if="videoData?.tags" class="tags">-->
        <!--          <n-tag v-for="(item, index) in videoData.tags" :key="index" :bordered="false" round>-->
        <!--            {{ item }}-->
        <!--          </n-tag>-->
        <!--        </n-flex>-->
        <n-divider />
      </div>
      <div v-else class="desc">
        <n-skeleton :repeat="3" text round />
      </div>
    </Transition>
    <!-- 评论 -->
    <div class="comment">
      <n-flex class="title" justify="space-between">
        <n-h3 prefix="bar">
          评论
          <n-text class="num" depth="3">{{ 0 }}</n-text>
        </n-h3>
        <n-flex class="tag">
          <n-tag
            v-for="(item, key, index) in commentText"
            :key="index"
            :bordered="false"
            :type="key === commentType ? 'primary' : 'default'"
            round
          >
            {{ item }}
          </n-tag>
        </n-flex>
      </n-flex>
      <CommentList
        :data="commentData"
        :loading="commentLoading"
        :loadMore="commentHasMore"
        @loadMore="loadMoreComment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore, useStatusStore } from "@/stores";
import { getMVUrlStr, videoDetail } from "@/api/video";
import { isEmpty } from "lodash-es";
import { formatNumber } from "@/utils/helper";
import { getComment } from "@/api/comment";
import player from "@/utils/player";
// Plyr
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { CommentInfo, MVInfo } from "@/types/main.hemusic";

const router = useRouter();
const statusStore = useStatusStore();
const dataStore = useDataStore();

// 是否激活
const isActivated = ref<boolean>(false);

// 视频参数
const videoId = computed<string>(() => router.currentRoute.value.query.id as string);
const videoPlatform = computed<string>(() => router.currentRoute.value.query.platform as string);

// 视频数据
const videoRef = ref<HTMLVideoElement | null>(null);
const videoData = ref<MVInfo | null>(null);
const videoPlayer = ref<Plyr | null>(null);

// 评论数据
const commentLoading = ref<boolean>(true);
const commentData = ref<CommentInfo[]>([]);
const commentType = ref<"hot" | "new">("hot");
const commentPage = ref<number>(1);
const commentHasMore = ref<boolean>(true);
const commentText = { hot: "最热", new: "最新" };
const commentLastId = ref<string>("");

// 播放器配置
const playerOptions: Plyr.Options = {
  controls: [
    "play-large",
    "play",
    "progress",
    "current-time",
    "mute",
    "volume",
    "captions",
    "settings",
    "airplay",
    "pip",
    "fullscreen",
  ],
  settings: ["captions", "quality", "speed"],
  ratio: "16:9",
  invertTime: false,
  autoplay: true,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  quality: {
    default: 1080,
    // options: [],
    // options: [1080, 720, 480, 240],
  },
  i18n: {
    play: "播放",
    pause: "暂停",
    speed: "速度",
    settings: "设置",
    normal: "正常",
    quality: "画质",
    pip: "画中画",
    enterFullscreen: "开启全屏",
    exitFullscreen: "退出全屏",
    mute: "音量",
    unmute: "静音",
  },
  tooltips: {
    controls: true,
  },
};

// 初始化播放器
const initPlayer = () => {
  videoData.value = null;
  videoPlayer.value?.destroy();
  if (videoRef.value) videoPlayer.value = new Plyr(videoRef.value, playerOptions);
  // 播放器事件
  videoPlayer.value?.on("playing", () => {
    player.pause();
  });
};

// 获取视频数据
const getVideoData = async (id: string, platform: string) => {
  console.log("getVideoData", id, platform);
  try {
    if (!id || !platform || !videoPlayer.value) return;
    // 获取视频详情
    const result = await videoDetail(id, platform);
    videoData.value = result;
    const sources =
      videoData.value?.links?.map((item) => {
        return {
          src:
            item.url || getMVUrlStr(platform, id, item.quality, item.format, true, dataStore.token),
          type: "video/mp4",
          size: item.quality,
        };
      }) || [];

    // 更改播放地址
    videoPlayer.value.source = {
      type: "video",
      title: videoData.value?.name,
      sources,
      poster: videoData.value?.cover,
    };
    // 获取评论
    getCommentData(id, platform);
  } catch (error) {
    console.error("Error getting video data:", error);
    window.$message.error("获取视频数据失败");
  }
};

// 获取评论数据
const getCommentData = async (id: string, platform: string, clean: boolean = true) => {
  try {
    if (!id || !platform) return;
    commentLoading.value = true;
    if (clean) commentData.value = [];
    // 获取评论
    const result = await getComment(
      id,
      videoPlatform.value,
      "mv",
      commentPage.value,
      20,
      commentLastId.value,
      commentType.value === "hot",
    );
    if (isEmpty(result.list)) {
      commentHasMore.value = false;
      commentLoading.value = false;
      return;
    }
    // 处理数据
    commentData.value = commentData.value.concat(result.list);
    // 是否还有
    commentHasMore.value = result.has_more;
    commentLastId.value = result.last_id;
    commentLoading.value = false;
  } catch (error) {
    console.error("Error getting comment data:", error);
    window.$message.error("获取评论数据失败");
  }
};

// 加载更多评论
const loadMoreComment = () => {
  commentPage.value++;
  if (commentHasMore.value) getCommentData(videoId.value, videoPlatform.value, false);
};

// 关闭音乐播放
const closeMusic = (close: boolean = true) => {
  statusStore.showPlayBar = !close;
  if (close) player.pause();
};

onActivated(() => {
  if (!isActivated.value) {
    isActivated.value = true;
  } else {
    closeMusic();
    if (videoId.value !== videoData.value?.id) {
      // initPlayer();
      getVideoData(videoId.value, videoPlatform.value);
    }
  }
});

onDeactivated(() => {
  closeMusic(false);
});

onMounted(() => {
  closeMusic();
  // 初始化播放器
  initPlayer();
  // 获取视频数据
  getVideoData(videoId.value, videoPlatform.value);
});

onUnmounted(() => {
  closeMusic(false);
});
</script>

<style lang="scss" scoped>
.video {
  --plyr-color-main: var(--primary-hex);
  --plyr-video-control-color-hover: var(--background-hex);
  --plyr-control-radius: 8px;
  .info {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 60px;
    margin: 20px 0;
    .name {
      font-size: 28px;
      font-weight: bold;
      line-height: 30px;
      margin-bottom: 8px;
    }
    .meta {
      width: 100%;
      .item {
        display: flex;
        align-items: center;
        .n-icon {
          font-size: 18px;
          margin-right: 6px;
        }
      }
    }
  }
  .player {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    :deep(.plyr) {
      height: 100%;
      width: 100%;
      max-height: 520px;
      border-radius: 12px;
      .plyr__control {
        &.plyr__control--overlaid {
          opacity: 1;
          background-color: rgba(var(--primary), 0.26);
          backdrop-filter: blur(10px);
        }
        &:hover {
          background-color: rgba(var(--primary), 0.56);
        }
      }
    }
    // &.hidden {
    //   :deep(.plyr) {
    //     position: fixed;
    //     right: 40px;
    //     bottom: 40px;
    //     width: 400px;
    //     height: auto;
    //     z-index: 999;
    //   }
    // }
  }
  .menu {
    height: 40px;
    margin: 20px 0;
    .artist {
      display: flex;
      align-items: center;
      margin-left: 8px;
      cursor: pointer;
      .cover {
        margin-right: 12px;
        width: 40px;
        height: 40px;
      }
      .name {
        display: inline-flex;
        flex-direction: column;
        font-size: 16px;
        font-weight: bold;
        &::after {
          content: "查看详情";
          font-size: 12px;
          font-weight: normal;
          opacity: 0.6;
        }
      }
    }
    .n-button {
      border-radius: 8px;
    }
  }
  .desc {
    padding: 0 6px;
    margin-bottom: 20px;
    .n-divider {
      margin: 12px 0;
    }
    :deep(.n-ellipsis) {
      cursor: pointer;
    }
    .tags {
      margin-top: 4px;
    }
  }
  .comment {
    .title {
      margin-bottom: 20px;
      .n-h {
        display: inline-flex;
        align-items: center;
        margin-bottom: 0;
        .num {
          margin-left: 6px;
          font-size: 14px;
          line-height: 18px;
        }
      }
    }
  }
}
</style>
