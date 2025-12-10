import { h } from "vue";
import type { SettingType, UpdateInfoType } from "@/types/main";
import type { ModalReactive } from "naive-ui";
import type { SongInfo, UserPlaylistInfo } from "@/types/main.hemusic";
import { isLogin } from "./auth";
import { isArray, isFunction } from "lodash-es";
import { NScrollbar } from "naive-ui";
import router from "@/router";
import Login from "@/components/Modal/Login/Login.vue";
import JumpArtist from "@/components/Modal/JumpArtist.vue";
import UserAgreement from "@/components/Modal/UserAgreement.vue";
import SongInfoEditor from "@/components/Modal/SongInfoEditor.vue";
import PlaylistAdd from "@/components/Modal/PlaylistAdd.vue";
import BatchList from "@/components/Modal/BatchList.vue";
import CreatePlaylist from "@/components/Modal/CreatePlaylist.vue";
import UpdatePlaylist from "@/components/Modal/UpdatePlaylist.vue";
import DownloadSong from "@/components/Modal/DownloadSong.vue";
import MainSetting from "@/components/Setting/MainSetting.vue";
import UpdateApp from "@/components/Modal/UpdateApp.vue";

import UpdateUserPassword from "@/components/Modal/UpdateUserPassword.vue";
import UpdateUserInfo from "@/components/Modal/UpdateUserInfo.vue";
import ExcludeLyrics from "@/components/Modal/ExcludeLyrics.vue";
import ChangeRate from "@/components/Modal/ChangeRate.vue";
import AutoClose from "@/components/Modal/AutoClose.vue";
import Equalizer from "@/components/Modal/Equalizer.vue";
import ParseSourceUrl from "@/components/Modal/ParseSourceUrl.vue";
import { usePlatformStore } from "@/stores";
import { FeatureSupportFlag } from "@/api/platform";
import Captcha from "@/components/Modal/Captcha.vue";
import CopyLyrics from "@/components/Modal/CopyLyrics.vue";
import { t } from "@/i18n";

// 用户协议
export const openUserAgreement = () => {
  const isAgree = window.localStorage.getItem("isAgree");
  if (isAgree) return;

  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    maskClosable: false,
    closeOnEsc: false,
    closable: false,
    style: {
      maxWidth: "70vw",
    },
    content: () => {
      return h(UserAgreement, {
        onClose: () => {
          modal.destroy();
          // 储存状态
          window.localStorage.setItem("isAgree", Date.now().toString());
        },
      });
    },
    onEsc: () => {
      window.$message.warning(t("message.agreement_required"));
    },
  });
};

let isLoginModalOpened = false;
// 用户登录
export const openUserLogin = (showTip: boolean = false) => {
  if (showTip) window.$message.warning(t("message.login_required"));
  if (isLoginModalOpened) return;
  isLoginModalOpened = true;
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    maskClosable: false,
    closeOnEsc: false,
    closable: false,
    style: { width: "400px" },
    content: () => {
      return h(Login, { onClose: () => modal.destroy() });
    },
    onAfterLeave: () => {
      isLoginModalOpened = false;
    },
  });
};

// 跳转到歌手
export const openJumpArtist = (platform: string, data: SongInfo["artists"]) => {
  const platformStore = usePlatformStore();
  if (!platformStore.isFeatureSupport(platform, FeatureSupportFlag.GetSingerInfo)) {
    return;
  }

  // 若 data 为数组且只有一个元素，则直接跳转
  if (isArray(data) && data.length === 1) {
    const id = data[0].id;
    router.push({ name: "artist", query: { id, platform } });
    return;
  }
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("modal.artist_jump"),
    content: () => {
      return h(JumpArtist, { artist: data, platform, onClose: () => modal.destroy() });
    },
  });
};

// 编辑歌曲信息
export const openSongInfoEditor = (song: SongInfo) => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    trapFocus: false,
    // contentStyle: { padding: 0 },
    style: { width: "600px" },
    title: t("modal.song_info_edit"),
    content: () => {
      return h(SongInfoEditor, { song, onClose: () => modal.destroy() });
    },
  });
};

// 添加到歌单
export const openPlaylistAdd = (data: SongInfo[], isLocal: boolean) => {
  if (!data.length) return window.$message.warning(t("message.please_select_song"));
  if (!isLogin() && !isLocal) return openUserLogin();
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("menu.add_to_playlist"),
    content: () => {
      return h(PlaylistAdd, { data, isLocal, onClose: () => modal.destroy() });
    },
  });
};

/**
 * 开启批量操作
 * @param data 歌曲列表
 * @param isLocal 是否为本地音乐
 * @param playListId 歌单 id
 */
export const openBatchList = (data: SongInfo[], isLocal: boolean, playListId?: string) => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: {
      maxWidth: "70vw",
    },
    title: t("common.batch_operation"),
    content: () => h(BatchList, { data, isLocal, playListId }),
  });
};

// 新建歌单
export const openCreatePlaylist = () => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("modal.create_playlist"),
    content: () => {
      return h(CreatePlaylist, { onClose: () => modal.destroy() });
    },
  });
};

// 编辑歌单
export const openUpdatePlaylist = (
  id: string,
  data: UserPlaylistInfo,
  func: () => Promise<void>,
) => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("modal.playlist_edit"),
    content: () => {
      return h(UpdatePlaylist, {
        id,
        data,
        onSuccess: () => {
          modal.destroy();
          // 触发回调
          if (isFunction(func)) func();
        },
      });
    },
  });
};

// 下载歌曲
export const openDownloadSong = (song: SongInfo) => {
  // if (!isLogin()) return openUserLogin();
  // 是否可下载
  if (!song) return window.$message.warning(t("message.please_select_song"));
  if (song.links?.length === 0) {
    return window.$message.warning(t("message.song_not_support_download"));
  }
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("common.download_song"),
    content: () => {
      return h(DownloadSong, { song, onClose: () => modal.destroy() });
    },
  });

  return;
};

let settingModal: ModalReactive | null = null;
// 打开设置
export const openSetting = (type: SettingType = "general") => {
  if (settingModal) {
    settingModal.destroy();
  }
  settingModal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    maskClosable: false,
    closeOnEsc: false,
    bordered: true,
    class: "main-setting",
    onClose: () => {
      settingModal = null;
    },
    content: () => {
      return h(MainSetting, { type });
    },
  });
};

// 软件更新
export const openUpdateApp = (data: UpdateInfoType) => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("modal.found_new_version"),
    content: () => {
      return h(UpdateApp, { data, onClose: () => modal.destroy() });
    },
  });
};

// 修改信息
export const openUpdateUserInfo = () => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    maskClosable: false,
    autoFocus: false,
    style: { width: "400px" },
    title: t("nav.modify_info"),
    content: () => {
      return h(UpdateUserInfo, { onClose: () => modal.destroy() });
    },
  });
};

// 修改密码
export const openUpdateUserPassword = () => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    maskClosable: false,
    autoFocus: false,
    style: { width: "400px" },
    title: t("modal.modify_password"),
    content: () => {
      return h(UpdateUserPassword, { onClose: () => modal.destroy() });
    },
  });
};

// 歌词排除内容
export const openLyricExclude = () => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("setting.lyrics.lyrics_exclude_content"),
    content: () => {
      return h(ExcludeLyrics);
    },
  });
};
// 歌词排除内容
export const openParseSourceUrl = () => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("nav.parse_source_url"),
    content: () => {
      return h(ParseSourceUrl, { onClose: () => modal.destroy() });
    },
  });
};

export const openCaptcha = (scene: number, meta: string) => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "375px" },
    title: t("modal.security_verify"),
    maskClosable: false,
    content: () => {
      return h(Captcha, { scene, meta, onClose: () => modal.destroy() });
    },
  });
};

/** 打开播放速度弹窗 */
export const openChangeRate = () => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("common.play_rate"),
    content: () => {
      return h(ChangeRate);
    },
  });
};

/** 打开自动关闭弹窗 */
export const openAutoClose = () => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("common.auto_close"),
    content: () => {
      return h(AutoClose);
    },
  });
};

/** 打开均衡器弹窗 */
export const openEqualizer = () => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "620px" },
    title: t("common.equalizer"),
    content: () => {
      return h(Equalizer);
    },
  });
};

/**
 * 打开简介弹窗
 * @param content 简介内容
 */
export const openDescModal = (content: string) => {
  window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "600px" },
    title: t("common.description"),
    content: () => {
      return h(
        NScrollbar,
        { style: { maxHeight: "400px" } },
        {
          default: () =>
            h("div", { style: { whiteSpace: "pre-wrap" } }, { default: () => content }),
        },
      );
    },
  });
};

/** 打开复制歌词弹窗 */
export const openCopyLyrics = () => {
  const modal = window.$modal.create({
    preset: "card",
    transformOrigin: "center",
    autoFocus: false,
    style: { width: "500px" },
    title: t("common.copy_lyrics"),
    content: () => {
      return h(CopyLyrics, {
        onClose: () => modal.destroy(),
      });
    },
  });
};
