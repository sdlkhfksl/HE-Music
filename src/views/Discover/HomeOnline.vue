<template>
  <div class="home-online">
    <!-- 公共推荐 -->
    <div v-for="(item, index) in pageData" :key="index" class="rec-public">
      <n-flex v-if="loading || item.list.length > 0" class="title" align="center" justify="space-between">
        <n-h3 prefix="bar">
          <n-text>{{ item.name }}</n-text>
          <SvgIcon
            v-if="item.path"
            :size="26"
            name="Right"
            @click="router.push({ name: item.path, query: { platform: platform } })"
          />
        </n-h3>
      </n-flex>
      <!-- 列表 -->
      <AlbumList
        v-if="item.type === 'album' && (loading || item.list.length > 0)"
        :data="item.list"
        :loading="true"
      />
      <VideoList
        v-else-if=" item.type === 'video'&& (loading || item.list.length > 0) "
        :data="item.list"
        :cols="item.cols"
        :loading="true"
      />
      <PlaylistList
        v-else-if="item.type === 'playlist'&& (loading || item.list.length > 0) "
        :data="item.list"
        :loading="true"
      />
      <SongList
        v-else-if="item.type === 'song' && (loading || item.list.length > 0) "
        :data="item.list"
        height="auto"
        :loading="true"
        :showFooter="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NText } from "naive-ui";
import SvgIcon from "@/components/Global/SvgIcon.vue";
import { discoverPage } from "@/api/page";
import { AlbumInfo, MVInfo, PlaylistInfo, SongInfo } from "@/types/main.hemusic";
import AlbumList from "@/components/List/AlbumList.vue";
import SongList from "@/components/List/SongList.vue";
import VideoList from "@/components/List/VideoList.vue";
import PlaylistList from "@/components/List/PlaylistList.vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  platform: string;
}>();

const router = useRouter();

interface RecItemType {
  name: string;
  list: any[];
  type: string;
  path?: string;
  cols?: string;
}

interface RecDataType {
  new_song_list: RecItemType;
  new_album_list: RecItemType;
  featured_mv_list: RecItemType;
  featured_playlist_list: RecItemType;
}

const loading = ref(true);

// 推荐数据
const pageData = ref<RecDataType>({
  new_song_list: {
    name: "新歌速递",
    list: [] as SongInfo[],
    type: "song",
    path: "new-song",
  },
  new_album_list: {
    name: "新碟上架",
    list: [] as AlbumInfo[],
    type: "album",
    path: "new-album",
  },
  featured_mv_list: {
    name: "视频",
    list: [] as MVInfo[],
    type: "video",
    cols: "2 600:2 800:3 900:4 1200:5 1400:6",
  },
  featured_playlist_list: {
    name: "精选歌单",
    type: "playlist",
    list: [] as PlaylistInfo[],
  },
});

// 获取全部发现数据
const getAllDiscoverData = async () => {
  try {
    const res = await discoverPage(props.platform);
    pageData.value.new_song_list.list = res.new_song_list;
    pageData.value.new_album_list.list = res.new_album_list;
    pageData.value.featured_mv_list.list = res.featured_mv_list;
    pageData.value.featured_playlist_list.list = res.featured_playlist_list;
  } catch (error) {
    console.error("Error getting discover page:", error);
  }
  loading.value = false;
};

onMounted(getAllDiscoverData);
</script>

<style lang="scss" scoped>
.main-rec {
  .date {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    .date-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;
      .n-text {
        position: absolute;
        font-size: 12px;
        color: var(--primary-hex);
        line-height: normal;
        margin-top: 4px;
        transform: scale(0.8);
      }
    }
    .name {
      font-size: 18px;
      font-weight: bold;
    }
  }
}
.title {
  margin-top: 10px;
  padding: 0 4px;
  .n-h {
    margin: 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    .n-icon {
      opacity: 0;
      transform: translateX(4px);
      transition:
        opacity 0.3s,
        transform 0.3s;
    }
    &:hover {
      .n-icon {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }
}
</style>
