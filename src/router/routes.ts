import { type RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  // 首页
  {
    path: "",
    name: "home",
    redirect: "/discover",
  },
  // 搜索
  {
    path: "/search",
    name: "search",
    component: () => import("@/views/Search/layout.vue"),
    beforeEnter: (to, _, next) => {
      if (!to.query.keyword) next({ path: "/403" });
      else next();
    },
    // redirect: "/search/songs",
    // children: [
    //   {
    //     path: "songs",
    //     name: "search-songs",
    //     component: () => import("@/views/Search/songs.vue"),
    //   },
    //   {
    //     path: "playlists",
    //     name: "search-playlists",
    //     component: () => import("@/views/Search/playlists.vue"),
    //   },
    //   {
    //     path: "artists",
    //     name: "search-artists",
    //     component: () => import("@/views/Search/artists.vue"),
    //   },
    //   {
    //     path: "albums",
    //     name: "search-albums",
    //     component: () => import("@/views/Search/albums.vue"),
    //   },
    //   {
    //     path: "videos",
    //     name: "search-videos",
    //     component: () => import("@/views/Search/videos.vue"),
    //   },
    //   {
    //     path: "radios",
    //     name: "search-radios",
    //     component: () => import("@/views/Search/radios.vue"),
    //   },
    // ],
  },
  // 发现
  {
    path: "/discover",
    name: "discover",
    component: () => import("@/views/Discover/index.vue"),
  },
  // 新歌
  {
    path: "/new-song",
    name: "new-song",
    component: () => import("@/views/NewSong/layout.vue"),
    beforeEnter: (to, _, next) => {
      if (!to.query.platform) next({ path: "/403" });
      else next();
    },
  },
  {
    path: "/new-album",
    name: "new-album",
    component: () => import("@/views/NewAlbum/layout.vue"),
    beforeEnter: (to, _, next) => {
      if (!to.query.platform) next({ path: "/403" });
      else next();
    },
  },
  // 歌手
  {
    path: "/artist",
    name: "artist",
    beforeEnter: (to, _, next) => {
      if (!to.query.id || !to.query.platform) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/Artist/layout.vue"),
    redirect: "/artist/songs",
    children: [
      {
        path: "songs",
        name: "artist-songs",
        component: () => import("@/views/Artist/songs.vue"),
      },
      {
        path: "albums",
        name: "artist-albums",
        component: () => import("@/views/Artist/albums.vue"),
      },
      {
        path: "videos",
        name: "artist-videos",
        component: () => import("@/views/Artist/videos.vue"),
      },
    ],
  },
  // 歌单
  {
    path: "/video",
    name: "video",
    beforeEnter: (to, _, next) => {
      if (!to.query.id || !to.query.platform) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/Video.vue"),
  },
  // 专辑
  {
    path: "/album",
    name: "album",
    beforeEnter: (to, _, next) => {
      if (!to.query.id || !to.query.platform) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/List/album.vue"),
  },
  // 歌单
  {
    path: "/playlist",
    name: "playlist",
    beforeEnter: (to, _, next) => {
      if (!to.query.id || !to.query.platform) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/List/playlist.vue"),
  },
  // 用户歌单
  {
    path: "/user-playlist",
    name: "user-playlist",
    beforeEnter: (to, _, next) => {
      if (!to.query.id) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/List/userplaylist.vue"),
  },
  {
    path: "/playlist-square",
    name: "playlist-square",
    component: () => import("@/views/PlaylistSquare/PlaylistSquare.vue"),
  },
  // toplist
  {
    path: "/top-list",
    name: "top-list",
    component: () => import("@/views/TopList/TopList.vue"),
  },
  {
    path: "/top",
    name: "top",
    beforeEnter: (to, _, next) => {
      if (!to.query.id || !to.query.platform) next({ path: "/403" });
      else next();
    },
    component: () => import("@/views/List/top.vue"),
  },
  // 我喜欢的音乐
  // {
  //   path: "/like-songs",
  //   name: "like-songs",
  //   meta: { needLogin: true },
  //   // component: () => import("@/views/List/liked.vue"),
  // },
  // // 每日推荐
  // {
  //   path: "/daily-songs",
  //   name: "daily-songs",
  //   meta: { needLogin: true },
  //   component: () => import("@/views/DailySongs.vue"),
  // },
  // 收藏
  {
    path: "/like",
    name: "like",
    meta: { needLogin: true },
    component: () => import("@/views/Like/layout.vue"),
    redirect: "/like/playlists",
    children: [
      {
        path: "playlists",
        name: "like-playlists",
        component: () => import("@/views/Like/playlists.vue"),
      },
      {
        path: "albums",
        name: "like-albums",
        component: () => import("@/views/Like/albums.vue"),
      },
      {
        path: "artists",
        name: "like-artists",
        component: () => import("@/views/Like/artists.vue"),
      },
      {
        path: "videos",
        name: "like-videos",
        component: () => import("@/views/Like/videos.vue"),
      },
    ],
  },
  // 本地歌曲
  {
    path: "/local",
    name: "local",
    meta: { needApp: true, offline: true },
    component: () => import("@/views/Local/layout.vue"),
    redirect: "/local/songs",
    children: [
      {
        path: "songs",
        name: "local-songs",
        component: () => import("@/views/Local/song.vue"),
      },
      {
        path: "artists",
        name: "local-artists",
        component: () => import("@/views/Local/artists.vue"),
      },
      {
        path: "albums",
        name: "local-albums",
        component: () => import("@/views/Local/albums.vue"),
      },
    ],
  },
  // 最近播放
  {
    path: "/history",
    name: "history",
    meta: { offline: true },
    component: () => import("@/views/History.vue"),
  },
  // 状态
  {
    path: "/403",
    name: "403",
    component: () => import("@/views/Status/403.vue"),
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/Status/404.vue"),
  },
  {
    path: "/500",
    name: "500",
    component: () => import("@/views/Status/500.vue"),
  },
];

export default routes;
