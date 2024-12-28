<template>
  <div class="parse-url">
    <n-form ref="formRef" :model="formData" :rules="formRules">
      <n-form-item :show-label="false" path="url">
        <n-input
          v-model:value="formData.url"
          :autosize="{
            minRows: 4,
            maxRows: 6,
          }"
          :maxlength="300"
          placeholder="请输入分享链接"
          type="textarea"
          show-count
          clearable
        />
      </n-form-item>
    </n-form>
    <n-divider style="margin-bottom: 0; margin-top: 0" />
    <div class="parse-url-result">
      <n-skeleton v-if="loading" animated text height="50px" :repeat="2" />
      <n-empty v-else-if="!parseResult.success" description="解析失败" size="large" />
      <SongList
        height="auto"
        v-else-if="parseResult.type === 'song'"
        :data="parseResult.songs"
        :loading="true"
        :show-footer="false"
        :hidden-scrollbar="true"
        :hidden-album="true"
        :disabled-sort="true"
      />

      <!-- 解析结果 有loading中-->
      <n-table v-else :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>平台</th>
            <th>ID</th>
            <th>类型</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {{
                platformStore.getPlatformInfo(parseResult.platform)?.shortname ||
                parseResult.platform
              }}
            </td>
            <td>{{ parseResult.id }}</td>
            <td>{{ typeNameMap[parseResult.type] || parseResult.type }}</td>
            <td><n-button quaternary type="primary" @click="toJump"> 跳转 </n-button></td>
          </tr>
        </tbody>
      </n-table>
    </div>
    <n-divider style="margin-bottom: 0; margin-top: 0" />
    <n-button class="create" type="primary" @click="toParseSourceUrl"> 解析 </n-button>
  </div>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import { textRule } from "@/utils/rules";
import { debounce } from "lodash-es";
import { parseSourceUrl } from "@/api/source";
import SongList from "@/components/List/SongList.vue";
import { usePlatformStore } from "@/stores";
import { songInfo } from "@/api/song";

const platformStore = usePlatformStore();
const router = useRouter();

const emit = defineEmits<{ close: [] }>();

// 表单类型
interface FormType {
  url: string;
}

const typeNameMap = {
  song: "歌曲",
  playlist: "歌单",
  album: "专辑",
  singer: "歌手",
  mv: "视频",
};

const parseResult = ref({
  success: false,
  platform: "",
  id: "",
  type: "",
  songs: [],
});
const loading = ref(false);
// 在线歌单数据
const formRef = ref<FormInst | null>(null);
const formData = ref<FormType>({ url: "" });
const formRules: FormRules = { url: textRule };

// 新建歌单
const toParseSourceUrl = debounce(
  async (e: MouseEvent) => {
    e.preventDefault();
    // 是否输入
    await formRef.value?.validate((errors) => errors);
    loading.value = true;
    parseResult.value.success = false;
    parseResult.value.songs = [];
    parseSourceUrl(formData.value.url)
      .then(async ({ id, platform, type }) => {
        if (!id || !platform || !type) {
          window.$message.error("解析失败");
          return;
        }
        switch (type) {
          case "song": {
            const { list } = await songInfo(platform, id);
            parseResult.value.songs = list;
          }
          // fallthrough
          default:
            parseResult.value.success = true;
            parseResult.value.id = id;
            parseResult.value.platform = platform;
            parseResult.value.type = type;
        }
      })
      .finally(() => {
        loading.value = false;
      });
  },
  300,
  { leading: true, trailing: false },
);

const toJump = () => {
  emit("close");

  const query = {
    id: parseResult.value.id,
    platform: parseResult.value.platform,
  };
  switch (parseResult.value.type) {
    case "song":
      break;
    case "playlist":
      router.push({ name: "playlist", query });
      break;
    case "album":
      router.push({ name: "album", query });
      break;
    case "singer":
      router.push({ name: "artist", query });
      break;
    case "mv":
      router.push({ name: "video", query });
  }
};
</script>

<style lang="scss" scoped>
.parse-url {
  .create {
    width: 100%;
  }

  .parse-url-result {
    height: 130px;
    width: 100%;
  }

  .n-empty {
    //padding: 40px 0;
  }
}
</style>
