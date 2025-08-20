<!-- 快捷键设置 -->
<!-- 写的一坨屎 -->
<template>
  <div class="setting-type">
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.shortcut.global_shortcut") }}
      </n-h3>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.shortcut.open_global_shortcut") }}
          </n-text>
          <n-text class="tip" :depth="3">
            {{ t("setting.shortcut.open_global_shortcut_tip") }}
          </n-text>
        </div>
        <n-switch
          v-model:value="shortcutStore.globalOpen"
          class="set"
          :round="false"
          @update:value="updateGlobalOpen"
        />
      </n-card>
    </div>
    <div class="set-list">
      <n-h3 prefix="bar">
        {{ t("setting.shortcut.change_shortcut") }}
      </n-h3>
      <n-card id="shortcut-list" class="set-item">
        <n-list v-for="(item, key, index) in shortcutList" :key="index" class="shortcut" hoverable>
          <n-list-item>
            <template #prefix>
              <n-text class="name">
                {{ t("common." + snakeCase(key)) }}
              </n-text>
            </template>
            <n-thing>
              <n-flex>
                <n-input
                  :value="item.shortcut"
                  :placeholder="t('setting.shortcut.shortcut_placeholder')"
                  readonly
                  @focus="inputFocus(key)"
                  @blur="inputBlur"
                  @keydown.stop="inputKeyDown"
                  @keyup="keyHandled = ''"
                />
                <n-input
                  :value="item.globalShortcut"
                  :disabled="!shortcutStore.globalOpen"
                  :status="item?.isRegistered ? 'error' : 'success'"
                  :placeholder="t('setting.shortcut.shortcut_placeholder')"
                  readonly
                  @focus="inputFocus(key, true)"
                  @blur="inputBlur"
                  @keydown.stop="inputKeyDown"
                  @keyup="keyHandled = ''"
                >
                  <template #prefix>
                    <n-text :depth="3">
                      {{ t("common.global") }}
                    </n-text>
                  </template>
                </n-input>
              </n-flex>
            </n-thing>
          </n-list-item>
        </n-list>
      </n-card>
      <n-card class="set-item">
        <div class="label">
          <n-text class="name">
            {{ t("setting.shortcut.reset") }}
          </n-text>
        </div>
        <n-button type="primary" strong secondary @click="resetShortcut">
          {{ t("common.reset_default") }}
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useShortcutStore } from "@/stores";
import { formatForGlobalShortcut } from "@/utils/helper";
import { cloneDeep, debounce, includes, snakeCase, some } from "lodash-es";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const shortcutStore = useShortcutStore();

// 选中快捷键
const selectShortcut = ref<string | null>(null);
const selectGlobal = ref<boolean>(false);

// 按键标志位 - 防止重复触发
const keyHandled = ref<string>("");

// 快捷键列表
const shortcutList = ref(cloneDeep(shortcutStore.shortcutList));

// 获取按下的快捷键
const getShortcut = (e: KeyboardEvent): string => {
  // 允许输入
  const allowedCodes = [
    // 字母 a-z
    "KeyA",
    "KeyB",
    "KeyC",
    "KeyD",
    "KeyE",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyI",
    "KeyJ",
    "KeyK",
    "KeyL",
    "KeyM",
    "KeyN",
    "KeyO",
    "KeyP",
    "KeyQ",
    "KeyR",
    "KeyS",
    "KeyT",
    "KeyU",
    "KeyV",
    "KeyW",
    "KeyX",
    "KeyY",
    "KeyZ",
    // 数字 0-9
    "Digit0",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Numpad0",
    "Numpad1",
    "Numpad2",
    "Numpad3",
    "Numpad4",
    "Numpad5",
    "Numpad6",
    "Numpad7",
    "Numpad8",
    "Numpad9",
    // 空格
    "Space",
    // 方向键
    "ArrowLeft",
    "ArrowUp",
    "ArrowRight",
    "ArrowDown",
  ];
  if (!allowedCodes.includes(e.code)) return "";
  return e.code;
};

// 获得焦点
const inputFocus = (type: string, isGlobal: boolean = false) => {
  selectShortcut.value = type;
  selectGlobal.value = isGlobal;
  if (isGlobal) {
    window.electron.ipcRenderer.send("unregister-all-shortcut");
  }
};

// 失去焦点
const inputBlur = () => {
  if (selectShortcut.value) shortcutStore.registerAllShortcuts();
  selectShortcut.value = null;
  selectGlobal.value = false;
};

// 键盘按下
const inputKeyDown = async (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (!selectShortcut.value) return;
  // 记录标志位
  if (e.code === keyHandled.value) return;
  keyHandled.value = e.code;
  // 删除键
  if (e.code === "Backspace") {
    changeShortcut("");
    return;
  }
  // 特殊按键
  const isCtrl = e.ctrlKey || e.metaKey;
  const isShift = e.shiftKey;
  const isAlt = e.altKey;
  // 快捷键
  const keyCode = getShortcut(e);
  const shortcut = [isCtrl && "CmdOrCtrl", isShift && "Shift", isAlt && "Alt", keyCode]
    .filter(Boolean)
    .join("+");
  console.log(keyCode, e, [isCtrl && "CmdOrCtrl", isShift && "Shift", isAlt && "Alt", keyCode]);
  // 更改快捷键
  if (isRepeat(shortcut)) {
    window.$message.warning(t("message.shortcut_repeat"));
  } else {
    // 全局快捷键
    if (selectGlobal.value) {
      // 若为单个按键
      const key = isCtrl || isShift || isAlt ? shortcut : "CmdOrCtrl+Shift+" + keyCode;
      const globalShortcut = formatForGlobalShortcut(key);
      if (!globalShortcut) return;
      // 先更改
      shortcutList.value[selectShortcut.value].globalShortcut = globalShortcut;
      // 是否被占用
      await checkRegistered(globalShortcut);
      changeShortcut(globalShortcut);
    } else {
      changeShortcut(shortcut);
      window.$message.success(t("message.shortcut_set_success"));
    }
  }
};

// 更改快捷键
const changeShortcut = async (shortcut: string) => {
  if (!selectShortcut.value) return;
  shortcutList.value[selectShortcut.value][selectGlobal.value ? "globalShortcut" : "shortcut"] =
    shortcut;
  shortcutStore.shortcutList[selectShortcut.value][
    selectGlobal.value ? "globalShortcut" : "shortcut"
  ] = shortcut;
};

// 快捷键是否重复
const isRepeat = (shortcut: string): boolean => {
  return some(Object.values(shortcutStore.shortcutList), (item) => {
    return includes([item.shortcut, item.globalShortcut], shortcut);
  });
};

// 是否被占用
const checkRegistered = debounce(async (shortcut: string) => {
  try {
    if (!shortcut || !selectShortcut.value) return;
    const isRegistered = await window.electron.ipcRenderer.invoke(
      "is-shortcut-registered",
      formatForGlobalShortcut(shortcut),
    );
    if (isRegistered) window.$message.warning(t("message.shortcut_registered"));
    // 更新状态
    shortcutList.value[selectShortcut.value].isRegistered = isRegistered;
  } catch (error) {
    console.error("Error checking shortcut registration:", error);
    window.$message.error(t("message.shortcut_registered_fail"));
    changeShortcut("");
  }
}, 500);

// 开关全局快捷键
const updateGlobalOpen = (val: boolean) => {
  if (val) shortcutStore.registerAllShortcuts();
  else window.electron.ipcRenderer.send("unregister-all-shortcut");
};

// 重置快捷键
const resetShortcut = () => {
  window.$dialog.warning({
    title: t("setting.shortcut.reset"),
    content: t("message.shortcut_reset_confirm"),
    positiveText: t("common.reset"),
    negativeText: t("common.cancel"),
    onPositiveClick: () => {
      shortcutStore.$reset();
      shortcutList.value = cloneDeep(shortcutStore.shortcutList);
      window.$message.success(t("message.shortcut_reset_success"));
    },
  });
};

onMounted(() => {
  shortcutStore.registerAllShortcuts();
});
</script>

<style lang="scss" scoped>
#shortcut-list {
  overflow: hidden;
  :deep(.n-card__content) {
    padding: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .shortcut {
    width: 100%;
    .name {
      display: flex;
      justify-content: center;
      min-width: 80px;
    }
    .n-input {
      user-select: none;
    }
  }
}
</style>
