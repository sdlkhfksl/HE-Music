<template>
  <div class="login-phone">
    <n-form ref="formRef" :model="formData" :rules="formRules" class="phone-form">
      <n-form-item label="用户名" path="username">
        <n-input
          type="text"
          v-model:value="formData.username"
          :show-button="false"
          placeholder="请输入用户名"
          passively-activated
          clearable
          :maxlength="18"
          :minlength="4"
        >
          <template #prefix>
            <SvgIcon name="Phone" :depth="3" />
          </template>
        </n-input>
      </n-form-item>
      <n-form-item label="密码" path="password">
        <n-input
          v-model:value="formData.password"
          type="password"
          show-password-on="mousedown"
          placeholder="请输入密码"
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
        <n-button class="login" type="primary" @click="login"> 登录 </n-button>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import { accountLogin } from "@/api/login";
import { passwordRule, usernameRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { LoginType } from "@/types/main";

const emit = defineEmits<{
  saveLogin: [any, LoginType];
}>();

// 表单类型
interface FormType {
  username: string;
  password: string;
}

// 表单数据
const formRef = ref<FormInst | null>(null);
const formData = ref<FormType>({
  username: "",
  password: "",
});
const formRules = computed<FormRules>(() => ({
  username: usernameRule,
  password: passwordRule,
}));

// 登录
const login = debounce(async (e: MouseEvent) => {
  e.preventDefault();
  // 验证输入
  await formRef.value?.validate();
  // 登录
  const loginResult = await accountLogin(
    formData.value.username as string,
    formData.value.password as string,
  );
  emit("saveLogin", loginResult, "password");
  // if (loginResult.code !== 200) {
  //   window.$message.error("登录失败，请重试");
  //   return;
  // }
  // 是否含有 MUSIC_U
  // if (loginResult.cookie && loginResult.cookie.includes("MUSIC_U")) {
  //   // 去除 HTTPOnly
  //   loginResult.cookie = loginResult.cookie.replaceAll(" HTTPOnly", "");
  //   // 储存登录信息
  //   emit("saveLogin", loginResult, "phone");
  // } else {
  //   window.$message.error("登录出错，请重试");
  // }
}, 300);
</script>

<style lang="scss" scoped>
.login-phone {
  .phone-form {
    margin-top: 20px;
    .send {
      margin-left: 12px;
    }
    .login {
      width: 100%;
    }
  }
}
</style>
