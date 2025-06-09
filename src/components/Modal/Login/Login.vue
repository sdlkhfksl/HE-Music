<template>
  <div class="login">
    <img src="/icons/favicon.png?assest" alt="logo" class="logo" />
    <!-- 登录方式 -->
    <LoginPassword @saveLogin="saveLogin" />
    <!--    &lt;!&ndash; 其他方式 &ndash;&gt;-->
    <!--    <n-flex align="center" class="other">-->
    <!--      <n-button :focusable="false" size="small" quaternary round @click="specialLogin('uid')">-->
    <!--        UID 登录-->
    <!--      </n-button>-->
    <!--      <n-divider vertical />-->
    <!--      <n-button :focusable="false" size="small" quaternary round @click="specialLogin('cookie')">-->
    <!--        Cookie 登录-->
    <!--      </n-button>-->
    <!--    </n-flex>-->
    <!-- 关闭登录 -->
    <n-button :focusable="false" class="close" strong secondary round @click="emit('close')">
      <template #icon>
        <SvgIcon name="WindowClose" />
      </template>
      取消
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { updateUserData } from "@/utils/auth";
import { useDataStore, usePlatformStore, useSettingStore, useStatusStore } from "@/stores";

import LoginPassword from "@/components/Modal/Login/LoginPassword.vue";
import player from "@/utils/player";

const emit = defineEmits<{
  close: [];
}>();

const dataStore = useDataStore();
const platformStore = usePlatformStore();
const statusStore = useStatusStore();
const settingStore = useSettingStore();

// 保存登录信息
const saveLogin = async (loginData: any) => {
  console.log("loginData:", loginData);
  if (!loginData) return;
  // 更改状态
  emit("close");
  dataStore.userLoginStatus = true;
  dataStore.token = loginData.token;
  window.$message.success("登录成功");
  // 保存登录时间
  localStorage.setItem("lastLoginTime", Date.now().toString());
  await updateUserData();
  await platformStore.loadPlatforms();
  if (statusStore.playLoading) {
    player.initPlayer(settingStore.autoPlay, player.getSeek());
  }
};

onBeforeMount(() => {
  if (dataStore.userLoginStatus) {
    window.$message.warning("已登录，请勿再次操作");
    emit("close");
  }
});
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  .logo {
    width: 60px;
    height: 60px;
    margin: 20px auto 30px auto;
  }
  .other {
    margin: 20px 0;
    .n-button {
      width: 140px;
    }
  }
  .close {
    margin-bottom: 8px;
  }
}
</style>
