<template>
  <div class="update-password">
    <n-form ref="formRef" :model="formData" :rules="formRules" class="n-form">
      <n-form-item label="旧密码" path="old_password">
        <n-input
          v-model:value="formData.old_password"
          type="password"
          show-password-on="mousedown"
          placeholder="请输入旧密码"
          :maxlength="18"
          :minlength="6"
          passively-activated
          clearable
        >
          <template #prefix>
            <SvgIcon name="Password" :depth="3" />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item label="新密码" path="new_password">
        <n-input
          v-model:value="formData.new_password"
          type="password"
          show-password-on="mousedown"
          placeholder="请输入新密码"
          :maxlength="18"
          :minlength="6"
          passively-activated
          clearable
        >
          <template #prefix>
            <SvgIcon name="Password" :depth="3" />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item label="重复新密码" path="repeat_password">
        <n-input
          v-model:value="formData.repeat_password"
          type="password"
          show-password-on="mousedown"
          placeholder="请重复新密码"
          :maxlength="18"
          :minlength="6"
          passively-activated
          clearable
        >
          <template #prefix>
            <SvgIcon name="Password" :depth="3" />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item :show-label="false">
        <n-button class="update" type="primary" @click="updatePassword"> 保存 </n-button>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import { passwordRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { updateUserPassword } from "@/api/login";

const emit = defineEmits<{ close: [] }>();

// 表单类型
interface FormType {
  old_password: string;
  new_password: string;
  repeat_password: string;
}

// 表单数据
const formRef = ref<FormInst | null>(null);
const formData = ref<FormType>({
  old_password: "",
  new_password: "",
  repeat_password: "",
});

const formRules = computed<FormRules>(() => ({
  old_password: passwordRule,
  new_password: passwordRule,
  repeat_password: passwordRule,
}));

// 新建歌单
const updatePassword = debounce(
  async (e: MouseEvent) => {
    e.preventDefault();

    await formRef.value?.validate((errors) => errors);
    if (formData.value.new_password !== formData.value.repeat_password) {
      window.$message.error("两次密码不一致");
      return;
    }

    updateUserPassword(formData.value.old_password, formData.value.new_password).then(() => {
      emit("close");
      window.$message.success("修改密码成功");
    });
  },
  300,
  { leading: true, trailing: false },
);
</script>

<style lang="scss" scoped>
.update-password {
  .n-form {
    margin-top: 12px;
  }
  .update {
    width: 100%;
  }
  .n-empty {
    padding: 40px 0;
  }
}
</style>
