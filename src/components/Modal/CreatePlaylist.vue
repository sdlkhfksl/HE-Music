<template>
  <div class="create-playlist">
    <n-tabs v-model:value="playlistType" type="segment" animated>
      <n-tab-pane :disabled="!isLogin()" name="online" tab="在线歌单">
        <n-form ref="onlineFormRef" :model="onlineFormData" :rules="onlineFormRules">
          <n-form-item label="歌单名称" path="name">
            <n-input v-model:value="onlineFormData.name" placeholder="请输入歌单名称" />
          </n-form-item>
          <n-form-item label="歌单图片地址" path="cover">
            <n-input v-model:value="onlineFormData.cover" placeholder="请输入歌单图片地址" />
          </n-form-item>
          <n-form-item label="歌单描述" path="description">
            <n-input
              v-model:value="onlineFormData.description"
              :autosize="{
                minRows: 3,
                maxRows: 6,
              }"
              :maxlength="800"
              placeholder="请输入歌单描述"
              type="textarea"
              show-count
              clearable
            />
          </n-form-item>
        </n-form>
      </n-tab-pane>
      <n-tab-pane name="local" tab="本地歌单">
        <n-empty description="暂未实现" />
      </n-tab-pane>
    </n-tabs>
    <n-button class="create" type="primary" @click="toCreatePlaylist"> 新建 </n-button>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import { textRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { isLogin, updateUserCreatedPlaylist } from "@/utils/auth";
import { createUserPlaylist } from "@/api/userplaylist";

const emit = defineEmits<{ close: [] }>();

// 表单类型
interface OnlineFormType {
  name: string;
  cover?: string;
  description?: string;
}

// 歌单类别
const playlistType = ref<"online" | "local">(isLogin() ? "online" : "local");

// 在线歌单数据
const onlineFormRef = ref<FormInst | null>(null);
const onlineFormData = ref<OnlineFormType>({ name: "", cover: "", description: "" });
const onlineFormRules: FormRules = { name: textRule };

// 新建歌单
const toCreatePlaylist = debounce(
  async (e: MouseEvent) => {
    e.preventDefault();
    if (playlistType.value === "online") {
      // 是否输入
      await onlineFormRef.value?.validate((errors) => errors);
      // 新建歌单
      createUserPlaylist(
        onlineFormData.value.name || "",
        onlineFormData.value.cover || "",
        onlineFormData.value.description || "",
      ).then(() => {
        emit("close");
        window.$message.success("新建歌单成功");
        updateUserCreatedPlaylist();
      });
    }
  },
  300,
  { leading: true, trailing: false },
);
</script>

<style lang="scss" scoped>
.create-playlist {
  .n-form {
    margin-top: 12px;
  }
  .create {
    width: 100%;
  }
  .n-empty {
    padding: 40px 0;
  }
}
</style>
