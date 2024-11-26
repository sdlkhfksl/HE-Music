<template>
  <div class="update-playlist">
    <n-form ref="updateFormRef" :model="updateFormData" :rules="updateFormRules">
      <n-form-item label="歌单名" path="name">
        <n-input
          v-model:value="updateFormData.name"
          :disabled="isLiked"
          placeholder="请输入歌单名"
        />
      </n-form-item>
      <n-form-item label="歌单图片地址" path="cover">
        <n-input v-model:value="updateFormData.cover" placeholder="请输入歌单图片地址" />
      </n-form-item>
      <n-form-item label="歌单描述" path="description">
        <n-input
          v-model:value="updateFormData.description"
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
    <n-button class="create" type="primary" @click="toUpdatePlaylist"> 编辑 </n-button>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import { textRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { updateUserCreatedPlaylist } from "@/utils/auth";
import { UserPlaylistInfo } from "@/types/main.hemusic";
import { updateUserPlaylist } from "@/api/userplaylist";

// 表单类型
interface UpdateFormType {
  name: string;
  description?: string;
  cover?: string;
}

const props = defineProps<{
  id: string;
  data: UserPlaylistInfo;
}>();

const emit = defineEmits<{ success: [] }>();

// 是否为我喜欢
const isLiked = props.data.is_default === 1;

// 表单数据
const updateFormRef = ref<FormInst | null>(null);
const updateFormData = ref<UpdateFormType>({
  name: isLiked ? "我喜欢的音乐" : props.data.name,
  description: props.data.description,
  cover: props.data.cover,
});
const updateFormRules: FormRules = { name: textRule };

// 更新歌单
const toUpdatePlaylist = debounce(
  async (e: MouseEvent) => {
    e.preventDefault();
    // 是否输入
    await updateFormRef.value?.validate((errors) => errors);
    // 新建歌单
    await updateUserPlaylist(
      props.id,
      updateFormData.value.name,
      updateFormData.value.cover ?? "",
      updateFormData.value.description ?? "",
    );
    emit("success");
    window.$message.success("歌单编辑成功");
    await updateUserCreatedPlaylist();
  },
  300,
  { leading: true, trailing: false },
);
</script>

<style lang="scss" scoped>
.update-playlist {
  .create {
    width: 100%;
  }
}
</style>
