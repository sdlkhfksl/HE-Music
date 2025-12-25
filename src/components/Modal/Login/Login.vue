<template>
  <div class="login">
    <img src="/icons/favicon.png?asset" alt="logo" class="logo" />
    <!-- 登录方式 -->
    <LoginPassword @save-login="saveLogin" />
    <!-- 其他方式 -->
    <n-flex align="center" class="other">
      <n-button
        v-for="item in providers"
        :key="item"
        text
        style="font-size: 16px"
        @click="oauthLogin(item)"
      >
        <SvgIcon size="20" :name="item" />
        {{ item }}
      </n-button>
    </n-flex>
    <!-- 关闭登录 -->
    <n-button :focusable="false" class="close" strong secondary round @click="emit('close')">
      <template #icon>
        <SvgIcon name="WindowClose" />
      </template>
      {{ t("common.cancel") }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { updateUserData } from "@/utils/auth";
import { useDataStore, usePlatformStore, useSettingStore, useStatusStore } from "@/stores";

import LoginPassword from "@/components/Modal/Login/LoginPassword.vue";
import { usePlayer } from "@/utils/player";
import { useI18n } from "vue-i18n";
import { authCodeURL, authProviders } from "@/api/auth";
import SvgIcon from "@/components/Global/SvgIcon.vue";
import { openLink } from "@/utils/helper";
import { debounce } from "lodash-es";
import { isElectron } from "@/utils/env";

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

const player = usePlayer();
const dataStore = useDataStore();
const platformStore = usePlatformStore();
const statusStore = useStatusStore();
const settingStore = useSettingStore();

const providers = ref<string[]>([]);

// 保存登录信息
const saveLogin = async (loginData: any) => {
  console.log("loginData:", loginData);
  if (!loginData) return;
  // 更改状态
  emit("close");
  dataStore.userLoginStatus = true;
  dataStore.token = loginData.token;
  window.$message.success(t("modal.login_success"));
  // 保存登录时间
  localStorage.setItem("lastLoginTime", Date.now().toString());
  await updateUserData();
  await platformStore.loadPlatforms();
  if (statusStore.playLoading) {
    player.initPlayer(settingStore.autoPlay, player.getSeek());
  }
};

const oauthLogin = debounce(
  async (provider: string) => {
    const redirect_uri = isElectron
      ? `http://127.0.0.1:${Number(import.meta.env["VITE_SERVER_PORT"] || 25666)}/login/success`
      : window.location.origin;

    const { url } = await authCodeURL(provider, redirect_uri);

    if (isElectron) {
      openLink(url);
    } else {
      window.location.href = url;
    }
  },
  500,
  { leading: true, trailing: false },
);

onMounted(() => {
  authProviders().then((res) => {
    providers.value = res.list;
  });

  if (isElectron) {
    window.electron.ipcRenderer.removeAllListeners("login-success");
    window.electron.ipcRenderer.on("login-success", (_, data) => {
      if (data.userLoginStatus || data.token === dataStore.token) {
        return;
      }
      saveLogin(data);
    });
  }
});

onBeforeMount(() => {
  if (dataStore.userLoginStatus) {
    window.$message.warning(t("modal.already_login"));
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
    margin: 10px 0;
    .n-button {
      width: 140px;
    }
  }
  .close {
    margin-bottom: 8px;
  }
}
</style>
