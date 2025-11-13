<template>
  <Provider>
    <router-view />
  </Provider>
</template>

<script setup lang="ts">
import { useDataStore } from "@/stores";
import init from "@/utils/init";
import { useI18n } from "vue-i18n";
import blob from "@/utils/blob";
const { t } = useI18n();
const dataStore = useDataStore();

onMounted(async () => {
  const params = new URLSearchParams(location.search);
  const token = params.get("token");
  if (token) {
    dataStore.userLoginStatus = true;
    dataStore.token = token;
    window.$message.success(t("modal.login_success"));
    location.replace("/");
    return;
  }
  await init();
});
onUnmounted(() => {
  blob.revokeAllBlobURLs();
});
</script>
