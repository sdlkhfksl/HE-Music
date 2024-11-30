<template>
  <n-popover trigger="manual" :show="userMenuShow" @clickoutside="userMenuShow = false">
    <template #trigger>
      <div
        class="user"
        :style="{ pointerEvents: userMenuShow ? 'none' : 'auto' }"
        @click="openMenu"
      >
        <div class="avatar">
          <n-avatar
            v-if="dataStore.userLoginStatus"
            :src="dataStore.userData?.avatar"
            fallback-src="/images/avatar.jpg?assest"
            round
          />
          <n-avatar v-else round>
            <SvgIcon name="Person" :depth="3" size="26" />
          </n-avatar>
        </div>
        <div class="user-data">
          <n-text class="name">
            {{ dataStore.userLoginStatus ? dataStore.userData.nickname || "未知用户名" : "未登录" }}
          </n-text>
          <SvgIcon :class="['down', { open: userMenuShow }]" name="DropDown" :depth="3" />
        </div>
      </div>
    </template>
    <div class="user-menu" @click="userMenuShow = false">
      <!-- 喜欢数量 -->
      <div class="like-num">
        <div
          v-for="(item, index) in userLikeData"
          :key="index"
          class="num-item"
          @click="router.push({ name: item.name })"
        >
          <n-number-animation :from="0" :to="item.value" />
          <n-text :depth="3">{{ item.label }}</n-text>
        </div>
      </div>
      <n-divider />

      <n-flex >
        <n-button :focusable="false" size="small" tertiary round @click="openUpdateUserInfo">
          修改信息
        </n-button>
        <n-button :focusable="false"  size="small" tertiary round @click="openUpdateUserPassword">
          修改密码
        </n-button>
      </n-flex>
      <!-- 退出登录 -->
      <n-divider />
      <!-- 退出登录 -->
      <n-button :focusable="false" class="logout" strong secondary round @click="isLogout">
        <template #icon>
          <SvgIcon name="Power" />
        </template>
        退出登录
      </n-button>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { useDataStore } from "@/stores";
import {openUpdateUserInfo, openUpdateUserPassword, openUserLogin} from "@/utils/modal";
import { isLogin, toLogout, updateUserData } from "@/utils/auth";

const router = useRouter();
const dataStore = useDataStore();

// 用户菜单展示
const userMenuShow = ref<boolean>(false);

// 开启用户菜单
const openMenu = () => {
  if (dataStore.userLoginStatus) {
    userMenuShow.value = !userMenuShow.value;
  } else {
    openUserLogin();
  }
};

// 用户喜欢数据
const userLikeData = computed(() => {
  return [
    {
      label: "歌单",
      name: "like-playlists",
      value:
        (dataStore.userLikeData.playlists?.length || 0) +
        (dataStore.userCreatedPlaylist.length || 0),
    },
    {
      label: "专辑",
      name: "like-albums",
      value: dataStore.userLikeData.albums.length,
    },
    {
      label: "歌手",
      name: "like-artists",
      value: dataStore.userLikeData.artists.length,
    },
  ];
});

// 检查登录状态
const checkLoginStatus = async () => {
  await updateUserData();
};

// 退出登录
const isLogout = () => {
  if (!isLogin()) {
    openUserLogin();
    return;
  }
  window.$dialog.warning({
    title: "退出登录",
    content: "确认退出当前用户登录？",
    positiveText: "确认登出",
    negativeText: "取消",
    onPositiveClick: () => toLogout(),
  });
};

onBeforeMount(() => {
  checkLoginStatus();
});
</script>

<style lang="scss" scoped>
.user {
  display: flex;
  align-items: center;
  height: 34px;
  border-radius: 25px;
  background-color: rgba(var(--primary), 0.08);
  transition: background-color 0.3s;
  cursor: pointer;
  -webkit-app-region: no-drag;
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    min-width: 38px;
    border-radius: 50%;
    border: 2px solid rgba(var(--primary), 0.28);
    .n-avatar {
      width: 100%;
      height: 100%;
    }
  }
  .user-data {
    display: flex;
    align-items: center;
    padding-left: 8px;
    max-width: 200px;
    .vip {
      margin-left: 6px;
      height: 18px;
    }
    .down {
      font-size: 26px;
      margin-right: 4px;
      transition: transform 0.3s;
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  &:hover {
    background-color: rgba(var(--primary), 0.28);
  }
  &:active {
    background-color: rgba(var(--primary), 0.12);
  }
}
.user-menu {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 6px 0;
  .like-num {
    display: flex;
    justify-content: space-around;
    .num-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      .n-text {
        font-size: 12px;
        font-weight: normal;
      }
    }
  }
  .n-divider {
    margin: 12px 0;
  }
}
</style>
