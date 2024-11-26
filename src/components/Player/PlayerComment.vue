<!-- 播放器 - 评论 -->
<template>
  <div class="player-comment">
    <n-scrollbar ref="lyricScroll" class="lyric-scroll">
      <template v-if="commentHotData">
        <div class="placeholder">
          <div class="title">
            <SvgIcon name="Fire" />
            <span>热门评论</span>
          </div>
        </div>
        <CommentList :data="commentHotData" :loading="commentHotData?.length === 0" transparent />
      </template>
      <div class="placeholder">
        <div class="title">
          <SvgIcon name="Message" />
          <span>全部评论</span>
        </div>
      </div>
      <CommentList
        :data="commentData"
        :loading="commentLoading"
        type="song"
        :loadMore="commentHasMore"
        transparent
        @loadMore="loadMoreComment"
      />
      <div class="placeholder" />
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useMusicStore } from "@/stores";
import { getComment } from "@/api/comment";
import { isEmpty } from "lodash-es";
import { CommentInfo } from "@/types/main.hemusic";

const musicStore = useMusicStore();

// 歌曲 id
const songId = computed<string>(() => musicStore.playSong.id);
const songPlatform = computed<string>(() => musicStore.playSong.platform);

// 评论数据
const commentLoading = ref<boolean>(true);
const commentData = ref<CommentInfo[]>([]);
const commentHotData = ref<CommentInfo[] | null>([]);
const commentPage = ref<number>(1);
const commentHasMore = ref<boolean>(true);
const commentLastId = ref<string>("");

// 获取热门评论
const getHotCommentData = async () => {
  if (!songId.value) return;
  // 获取评论
  const result = await getComment(songId.value, songPlatform.value, "song", 1, 20, undefined, true);
  commentHotData.value = result.list?.length > 0 ? result.list : null;
};

// 获取歌曲评论
const getAllComment = async () => {
  if (!songId.value || !songPlatform.value) return;
  commentLoading.value = true;
  // 获取评论
  const result = await getComment(
    songId.value,
    songPlatform.value,
    "song",
    commentPage.value,
    20,
    commentLastId.value,
  );
  if (isEmpty(result.list)) {
    commentHasMore.value = false;
    commentLoading.value = false;
    return;
  }
  commentData.value = commentData.value.concat(result.list);
  // 是否还有
  commentHasMore.value = result.has_more;
  commentLoading.value = false;
  commentLastId.value = result.last_id;
};

// 加载更多
const loadMoreComment = () => {
  commentPage.value += 1;
  getAllComment();
};

onMounted(() => {
  getHotCommentData();
  getAllComment();
});
</script>

<style lang="scss" scoped>
.player-comment {
  flex: 1;
  height: 100%;
  width: 100%;
  overflow: hidden;
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2));
  mask: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0) 0,
    hsla(0, 0%, 100%, 0.6) 2%,
    #fff 5%,
    #fff 90%,
    hsla(0, 0%, 100%, 0.6) 95%,
    hsla(0, 0%, 100%, 0)
  );
  :deep(.n-text),
  :deep(.n-icon),
  :deep(.n-button) {
    color: rgb(var(--main-color)) !important;
  }
  :deep(.n-scrollbar-content) {
    padding-right: 60px;
  }
  .comment-list {
    margin: 0 auto;
  }
  .placeholder {
    width: 100%;
    height: 120px;
    padding-bottom: 20px;
    display: flex;
    align-items: flex-end;
    &:last-child {
      height: 0;
      padding-top: 50%;
    }
    .title {
      display: flex;
      align-items: center;
      font-size: 22px;
      font-weight: bold;
      .n-icon {
        margin-right: 6px;
      }
    }
  }
}
</style>
