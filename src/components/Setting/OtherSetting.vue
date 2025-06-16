<!-- 本地设置 -->
<template>
  <div class="setting-type">
    <!--    <div class="set-list">-->
    <!--      <n-h3 prefix="bar"> 地区解锁 </n-h3>-->
    <!--      <n-card class="set-item">-->
    <!--        <div class="label">-->
    <!--          <n-text class="name">使用真实 IP 地址</n-text>-->
    <!--          <n-text class="tip" :depth="3">在海外或部分地区可能会受到限制，可开启此处尝试解决</n-text>-->
    <!--        </div>-->
    <!--        <n-switch class="set" v-model:value="settingStore.useRealIP" :round="false" />-->
    <!--      </n-card>-->
    <!--      <n-card class="set-item">-->
    <!--        <div class="label">-->
    <!--          <n-text class="name">真实 IP 地址</n-text>-->
    <!--          <n-text class="tip" :depth="3">可在此处输入国内 IP</n-text>-->
    <!--        </div>-->
    <!--        <n-input-->
    <!--          v-model:value="settingStore.realIP"-->
    <!--          :disabled="!settingStore.useRealIP"-->
    <!--          placeholder="请填写真实 IP 地址"-->
    <!--          class="set"-->
    <!--        >-->
    <!--          <template #prefix>-->
    <!--            <n-text depth="3">IP</n-text>-->
    <!--          </template>-->
    <!--        </n-input>-->
    <!--      </n-card>-->
    <!--    </div>-->
    <div v-if="isElectron" class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.other.network_proxy") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.other.network_proxy") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.other.proxy_tip") }}
          </n-text>
        </div>
        <n-flex>
          <n-button type="primary" strong secondary @click="setProxy">
            {{ t("common.save_and_apply") }}
          </n-button>
          <n-select
            v-model:value="settingStore.proxyProtocol"
            :options="[
              {
                label: t('common.close'),
                value: 'off',
              },
              {
                label: 'HTTP',
                value: 'HTTP',
              },
              {
                label: 'HTTPS',
                value: 'HTTPS',
              },
            ]"
            class="set"
          />
        </n-flex>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.other.proxy_server") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.other.proxy_server_tip") }}
          </n-text>
        </div>
        <n-input
          v-model:value="settingStore.proxyServe"
          :disabled="settingStore.proxyProtocol === 'off'"
          :placeholder="t('setting.other.proxy_server_placeholder')"
          class="set"
        >
          <template #prefix>
            <n-text depth="3">
              {{ settingStore.proxyProtocol === "off" ? "-" : settingStore.proxyProtocol }}
            </n-text>
          </template>
        </n-input>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.other.proxy_port") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.other.proxy_port_tip") }}
          </n-text>
        </div>
        <n-input-number
          v-model:value="settingStore.proxyPort"
          :disabled="settingStore.proxyProtocol === 'off'"
          :show-button="false"
          :min="1"
          :max="65535"
          :placeholder="t('setting.other.proxy_port_placeholder')"
          class="set"
        />
      </n-card>
      <n-collapse-transition :show="settingStore.proxyProtocol !== 'off'">
        <n-card class="set-item">
          <div class="label">
            <n-text class="name">
              {{ t("setting.other.proxy_test") }}
            </n-text>
            <n-text class="tip" :depth="3">
              {{ t("setting.other.proxy_test_tip") }}
            </n-text>
          </div>
          <n-button :loading="testProxyLoading" type="primary" strong secondary @click="testProxy">
            {{ t("setting.other.proxy_test") }}
          </n-button>
        </n-card>
      </n-collapse-transition>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("common.reset") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.other.reset_setting") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.other.reset_setting_tip") }}
          </n-text>
        </div>
        <n-button type="warning" strong secondary @click="resetSetting">
          {{ t("setting.other.reset_setting_btn") }}
        </n-button>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.other.clear_all_data") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.other.clear_all_data_tip") }}
          </n-text>
        </div>
        <n-button type="error" strong secondary @click="clearAllData">
          {{ t("setting.other.clear_all_data_btn") }}
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingStore, useDataStore } from "@/stores";
import { isElectron } from "@/utils/helper";
import { debounce } from "lodash-es";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const dataStore = useDataStore();
const settingStore = useSettingStore();

const testProxyLoading = ref<boolean>(false);

// 获取当前代理配置
const proxyConfig = computed(() => ({
  protocol: settingStore.proxyProtocol,
  server: settingStore.proxyServe,
  port: settingStore.proxyPort,
}));

// 应用代理
const setProxy = debounce(() => {
  if (settingStore.proxyProtocol === "off" || !settingStore.proxyServe || !settingStore.proxyPort) {
    window.electron.ipcRenderer.send("remove-proxy");
    window.$message.success(t("message.proxy_close_success"));
    return;
  }
  window.electron.ipcRenderer.send("set-proxy", proxyConfig.value);
  window.$message.success(t("message.proxy_set_success"));
}, 300);

// 测试代理
const testProxy = async () => {
  testProxyLoading.value = true;
  const result = await window.electron.ipcRenderer.invoke("test-proxy", proxyConfig.value);
  if (result) {
    window.$message.success(t("message.proxy_test_success"));
  } else {
    window.$message.error(t("message.proxy_test_fail"));
  }
  testProxyLoading.value = false;
};

// 重置设置
const resetSetting = () => {
  window.$dialog.warning({
    title: t("common.warning"),
    content: t("message.reset_setting_confirm"),
    positiveText: t("common.ok"),
    negativeText: t("common.cancel"),
    onPositiveClick: () => {
      settingStore.$reset();
      // electron
      if (isElectron) window.electron.ipcRenderer.send("reset-setting");
      window.$message.success(t("message.reset_setting_success"));
    },
  });
};

// 清除全部数据
const clearAllData = () => {
  window.$dialog.warning({
    title: t("common.warning"),
    content: t("message.clear_all_data_confirm"),
    positiveText: t("common.ok"),
    negativeText: t("common.cancel"),
    onPositiveClick: async () => {
      // 重置设置
      window.localStorage.clear();
      window.sessionStorage.clear();
      // deleteDB
      await dataStore.deleteDB();
      // electron
      if (isElectron) window.electron.ipcRenderer.send("reset-setting");
      window.$message.loading(t("message.clear_all_data_success"), {
        duration: 3000,
        onAfterLeave: () => window.location.reload(),
      });
    },
  });
};
</script>
