<template>
  <div class="search-type" style="height: auto">
    <!--    <Transition name="fade" mode="out-in">-->
    <SongList
      v-if="searchCount > 0"
      :data="searchResultData"
      :loading="loading"
      loadMore
      disabledSort
      @reachBottom="reachBottom"
      :height="songListHeight"
    />
    <n-empty
      v-else
      :description="`很抱歉，未能找到与 ${keyword} 相关的任何歌曲`"
      style="margin-top: 60px"
      size="large"
    >
      <template #icon>
        <SvgIcon name="SearchOff" />
      </template>
    </n-empty>
    <!--    </Transition>-->
  </div>
</template>

<script setup lang="ts">
import { searchResultHemusic } from "@/api/search";
import SongList from "@/components/List/SongList.vue";
import { useStatusStore } from "@/stores";
import { SongInfo } from "@/types/main.hemusic";

const props = defineProps<{
  keyword: string;
  platform: string;
}>();

const statusStore = useStatusStore();

// 搜索数据
const hasMore = ref<boolean>(true);
const loading = ref<boolean>(true);
const searchPage = ref<number>(1);
const searchCount = ref<number>(1);
const searchResultData = ref<SongInfo[]>([]);

// 获取搜索结果
const getSearchResult = async () => {
  // 获取数据
  loading.value = true;
  searchResultHemusic(props.keyword, 30, searchPage.value, props.platform)
    .then((result) => {
      // 是否还有
      hasMore.value = result?.has_more;
      // 搜索总数
      searchCount.value = result?.total_num;
      // 处理数据
      searchResultData.value = searchResultData.value?.concat(result?.list);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 列表触底
const reachBottom = () => {
  if (hasMore.value) {
    searchPage.value++;
    getSearchResult();
  } else {
    loading.value = false;
  }
};

onMounted(() => {
  getSearchResult();
});

// 列表高度
const songListHeight = computed(() => {
  return statusStore.mainContentHeight - 175;
});
</script>
