<!-- 添加到歌单 -->
<template>
  <div class="captcha">
    <Click
      v-if="data.type === 1 || data.type === 2"
      :data="data"
      :events="{
        refresh: refresh,
        confirm: clickConfirm,
      }"
    />
    <Slide
      v-else-if="data.type === 4"
      :data="data"
      :events="{
        refresh: refresh,
        confirm: slideConfirm,
      }"
    />
    <SlideRegion
      v-else-if="data.type === 3"
      :data="data"
      :events="{
        refresh: refresh,
        confirm: slideConfirm,
      }"
    />
    <Rotate
      v-else-if="data.type === 5"
      :data="data"
      :events="{
        refresh: refresh,
        confirm: rotateConfirm,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { Click, Rotate, Slide, SlideRegion } from "go-captcha-vue";
import { getCaptcha, verifyCaptcha } from "@/api/captcha";
import { ClickDot } from "go-captcha-vue/dist/components/click/meta/data";
import { debounce } from "lodash-es";
interface CaptchaDataType {
  thumbX: number;
  thumbY: number;
  thumbWidth: number;
  thumbHeight: number;
  thumbSize: number;
  image: string;
  thumb: string;

  type: number;
}

const props = defineProps<{
  scene: number;
  meta: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

/*  // 点击文本
  CAPTCHA_TYPE_CLICK_TEXT = 1;
  // 点击形状
  CAPTCHA_TYPE_CLICK_SHAPE = 2;
  // 滑动
  CAPTCHA_TYPE_SLIDE = 3;
  // 拖拽
  CAPTCHA_TYPE_DRAG = 4;
  // 旋转
  CAPTCHA_TYPE_ROTATE = 5;
 */

const data = ref<CaptchaDataType>({
  thumbX: 0,
  thumbY: 0,
  thumbWidth: 0,
  thumbHeight: 0,
  thumbSize: 0,
  image: "",
  thumb: "",
  type: 0,
});

const loading = ref<boolean>(true);

const getCaptchaData = () => {
  loading.value = true;
  getCaptcha(data.value.type, props.scene, props.meta)
    .then((res) => {
      data.value = {
        ...res,
        thumbX: res.thumb_x,
        thumbY: res.thumb_y,
        thumbWidth: res.thumb_width,
        thumbHeight: res.thumb_height,
        thumbSize: res.thumb_size,
      };
    })
    .finally(() => {
      loading.value = false;
    });
};

// 新建歌单
const verify = debounce(
  async (angle: number = 0, point: object = {}, dots: object[] = [], reset: () => void) => {
    try {
      const res = await verifyCaptcha(props.scene, props.meta, angle, point, dots);
      if (res.is_expired) {
        window.$message.error("验证码已过期，请重试");
        refreshCaptcha(reset);
        return;
      }
      if (!res.is_success) {
        window.$message.error("验证失败，请重试");
        refreshCaptcha(reset);
        return;
      }
      window.$message.success("验证成功，请继续操作");
      emit("close");
    } catch (e: any) {
      window.$message.error(e?.message || "验证失败，请重试");
      refreshCaptcha(reset);
    }
  },
  300,
  { leading: true, trailing: false },
);

const clickConfirm = (dots: Array<ClickDot>, reset: () => void) => {
  verify(
    undefined,
    undefined,
    dots.map((item) => ({ x: item.x, y: item.y })),
    reset,
  );
};
const rotateConfirm = (angle: number, reset: () => void) => {
  verify(angle, undefined, undefined, reset);
};
const slideConfirm = (point: object, reset: () => void) => {
  verify(undefined, point, undefined, reset);
};

const refreshCaptcha = debounce(
  (reset?: () => void) => {
    if (reset) reset();
    getCaptchaData();
  },
  300,
  { leading: true, trailing: false },
);

const refresh = () => {
  refreshCaptcha();
};

onMounted(getCaptchaData);
</script>

<style lang="scss" scoped></style>
