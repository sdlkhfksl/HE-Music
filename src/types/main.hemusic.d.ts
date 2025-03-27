export interface PlatformInfo {
  //平台id
  id: string;
  //名字
  name: string;
  //缩写
  shortname: string;
  //排序 从小到大
  order: number;
  //标签
  tags: string[];
  // 支持的功能
  feature_support_flag: bigint;
  // 状态
  status: number;
}

export interface Link {
  name: string;
  quality: number;
  format: string;
  size: string;
  url: string;
}

export interface SingerInfo {
  id: string;
  name: string;
  cover: string;
  platform: string;
  description: string;
  mv_count: string;
  song_count: string;
  album_count: string;
  alias: string;
}

export interface SongInfo {
  name: string;
  subtitle: string;
  id: string;
  duration: number;
  mv_id: string;
  album: SongInfoAlbumInfo | string;
  singers?: SongInfoSingerInfo[] | string;
  links: Link[];
  platform: string;
  cover: string;

  // 以下
  path?: string;
  size?: number;
  quality?: string;
  alias?: string;
}

export interface PlaylistInfo extends CoverType {
  name: string;
  id: string;
  cover: string;
  creator: string;
  song_count: string;
  play_count: string;
  songs: SongInfo[];
  platform: string;
  description: string;
  tags: TagInfo[];
}

export interface AlbumInfo extends CoverType {
  name: string;
  id: string;
  cover: string;
  singers: SongInfoSingerInfo[];
  song_count: string;
  publish_time: string;
  songs: SongInfo[];
  description: string;
  platform: string;
  language: string;
  genre: string;
  type: number;
  is_finished: boolean;
}

export interface LyricInfo {
  id: string;
  lyric: string;
  trans: string;
  platform: string;
  roma: string;
}

export interface MVInfo extends CoverType {
  platform: string;
  links: Link[];
  //Id
  id: string;
  //显示的标题
  name: string;
  cover: string;
  //MVType
  type: number;
  play_count: string;
  creator: string;
  duration: number;
}

export interface CommentInfo {
  id: string;
  content: string;
  timestamp: string;
  praise_count: string;
  user: CommentInfoUser;
  be_replied: CommentInfo;
  reply_count: string;
  sub_comments: CommentInfo[];

  // 子评论用
  sub_has_more: boolean;
  sub_loading: boolean;
  sub_last_id: string;
  sub_page_index: number;
}

export interface TopInfo extends CoverType {
  name: string;
  id: string;
  cover: string;
  play_count: string;
  songs: SongInfo[];
  platform: string;
  description: string;
  page_index: number;
  page_size: number;
  total_count: string;
  last_id: string;
  has_more: boolean;
}

export interface TagGroupInfo {
  name: string;
  tag_list: TagInfo[];
}

export interface TagInfo {
  //70后
  name: string;
  id: string;
  platform: string;
}

export interface SongInfoSingerInfo {
  id: string;
  name: string;
}

export interface SongInfoAlbumInfo {
  name: string;
  id: string;
}

export interface CommentInfoUser {
  name: string;
  id: string;
  avatar: string;
}

export interface TabInfo {
  name: string;
  id: string;
  platform: string;
}

export interface UserPlaylistInfo extends PlaylistInfo {
  name: string;
  id: string;
  cover: string;
  creator: string;
  song_count: string;
  songs: SongInfo[];
  song_ids: IDPlatformInfo[];
  description: string;

  user_id: string;
  is_default: number;
  created_at: string;
}

export interface UserFavouritePlaylistInfo extends PlaylistInfo {
  name: string;
  id: string;
  cover: string;
  creator: string;
  platform: string;
}

export interface UserFavouriteAlbumInfo extends AlbumInfo {
  name: string;
  id: string;
  cover: string;
  singers: SongInfoSingerInfo[];
  platform: string;
}

export interface UserFavouriteSingerInfo extends SingerInfo {
  name: string;
  id: string;
  cover: string;
  platform: string;
}

export interface UserInfo {
  //用户id
  id: string;
  //用户名
  username: string;
  //昵称
  nickname: string;
  //email
  email: string;
  //状态
  status: number;
  // 头像
  avatar: string;
}

export interface IDPlatformInfo {
  //平台
  platform: string;
  //id
  id: string;
}

export interface UserFavouriteSongInfo {
  id: string;
  platform: string;
}

export interface CoverType {
  loading: boolean;
  id: string;
  platform: string;
}

export interface SearchDefaultInfo {
  key: string;
  description: string;
}
