<template>
  <div :key="searchKeyword" class="search">
    <div class="title">
      <n-text class="keyword">{{ searchKeyword }}</n-text>
      <n-text depth="3">的相关搜索</n-text>
    </div>
    <!-- 标签页 -->
    <n-tabs
      class="tabs"
      type="segment"
      animated
      default-value="song"
      v-model:value="searchType"
      @update:value="tabChange"
    >
      <!--      <n-tab name="search-songs"> 单曲 </n-tab>-->
      <!--      <n-tab name="search-playlists"> 歌单 </n-tab>-->
      <!--      <n-tab name="search-artists"> 歌手 </n-tab>-->
      <!--      <n-tab name="search-albums"> 专辑 </n-tab>-->
      <!--      <n-tab name="search-videos"> 视频 </n-tab>-->
      <!--      -->

      <!--      <n-tab name="search-radios"> 播客 </n-tab>-->

      <n-tab-pane name="song" tab="歌曲" display-directive="show:lazy">
        <n-tabs class="tabs" type="bar" animated>
          <n-tab-pane
            v-for="platform in supportSearchSongPlatforms"
            :key="`search-song-${platform.id}`"
            :name="platform.id"
            :tab="platform.shortname"
            :disabled="platform.status !== 1"
            display-directive="show:lazy"
          >
            <Songs :keyword="searchKeyword" :platform="platform.id" />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="playlist" tab="歌单" display-directive="show:lazy">
        <n-tabs class="tabs" type="bar" animated>
          <n-tab-pane
            v-for="platform in supportSearchPlaylistPlatforms"
            :key="`search-playlist-${platform.id}`"
            :name="platform.id"
            :tab="platform.shortname"
            :disabled="platform.status !== 1"
            display-directive="show:lazy"
          >
            <Playlists :keyword="searchKeyword" :platform="platform.id" />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="album" tab="专辑" display-directive="show:lazy">
        <n-tabs class="tabs" type="bar" animated>
          <n-tab-pane
            v-for="platform in supportSearchAlbumPlatforms"
            :key="`search-album-${platform.id}`"
            :name="platform.id"
            :tab="platform.shortname"
            :disabled="platform.status !== 1"
            display-directive="show:lazy"
          >
            <Albums :keyword="searchKeyword" :platform="platform.id" />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="artists" tab="歌手" display-directive="show:lazy">
        <n-tabs class="tabs" type="bar" animated>
          <n-tab-pane
            v-for="platform in supportSearchArtistPlatforms"
            :key="`search-album-${platform.id}`"
            :name="platform.id"
            :tab="platform.shortname"
            :disabled="platform.status !== 1"
            display-directive="show:lazy"
          >
            <Artists :keyword="searchKeyword" :platform="platform.id" />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
      <n-tab-pane name="videos" tab="视频" display-directive="show:lazy">
        <n-tabs class="tabs" type="bar" animated>
          <n-tab-pane
            v-for="platform in supportSearchVideoPlatforms"
            :key="`search-video-${platform.id}`"
            :name="platform.id"
            :tab="platform.shortname"
            :disabled="platform.status !== 1"
            display-directive="show:lazy"
          >
            <Videos :keyword="searchKeyword" :platform="platform.id" />
          </n-tab-pane>
        </n-tabs>
      </n-tab-pane>
    </n-tabs>

    <!-- 路由 -->
    <!--    <RouterView v-slot="{ Component }">-->
    <!--      <Transition :name="`router-${settingStore.routeAnimation}`" mode="out-in">-->
    <!--        <KeepAlive>-->
    <!--          <component :is="Component" :keyword="searchKeyword" class="router-view" />-->
    <!--        </KeepAlive>-->
    <!--      </Transition>-->
    <!--    </RouterView>-->
  </div>
</template>

<script setup lang="ts">
import { usePlatformStore } from "@/stores";
import Songs from "@/views/Search/songs.vue";
import Playlists from "@/views/Search/playlists.vue";
import Albums from "@/views/Search/albums.vue";
import Artists from "@/views/Search/artists.vue";
import Videos from "@/views/Search/videos.vue";
import { FeatureSupportFlag } from "@/api/platform";
import { onMounted } from "vue";

const router = useRouter();

const platformStore = usePlatformStore();

const supportSearchSongPlatforms =
  platformStore.featureSupportList(FeatureSupportFlag.SearchSong) || [];
const supportSearchAlbumPlatforms =
  platformStore.featureSupportList(FeatureSupportFlag.SearchAlbum) || [];
const supportSearchPlaylistPlatforms =
  platformStore.featureSupportList(FeatureSupportFlag.SearchPlaylist) || [];
const supportSearchArtistPlatforms =
  platformStore.featureSupportList(FeatureSupportFlag.SearchSinger) || [];
const supportSearchVideoPlatforms =
  platformStore.featureSupportList(FeatureSupportFlag.SearchMV) || [];

// 搜索分类
const searchType = ref<string>((router.currentRoute.value.query.type as string) || "song");

// const settingStore = useSettingStore();
// 搜索关键词
const searchKeyword = computed(() => router.currentRoute.value.query.keyword as string);

// 搜索分类
// const searchType = ref<string>((router.currentRoute.value?.name as string) || "search-songs");

// // Tabs 改变
const tabChange = (value: string) => {
  router.push({
    name: "search",
    query: {
      keyword: searchKeyword.value,
      type: value,
    },
  });
};

onBeforeRouteUpdate((to) => {
  if (to.matched[0].name !== "search") return;

  if (to.query.type) {
    searchType.value = to.query.type as string;
  }
});

onMounted(async () => {
  await platformStore.loadPlatforms();
});
</script>

<style lang="scss" scoped>
.search {
  display: flex;
  flex-direction: column;
  height: 100%;
  .title {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 22px;
    .keyword {
      font-size: 36px;
      font-weight: bold;
      margin-right: 8px;
      line-height: normal;
    }
    .n-text {
      display: inline-block;
    }
  }
  .router-view {
    flex: 1;
    overflow: hidden;
  }
}
</style>
