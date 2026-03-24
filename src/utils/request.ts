import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { isDev } from "./env";
import { useDataStore, useSettingStore } from "@/stores";
import { isLogin } from "./auth";
import { openCaptcha, openUserLogin } from "@/utils/modal";

export const API_URL = String(import.meta.env["VITE_API_URL"]);
// 全局地址
const baseURL: string = String(isDev ? "/api/netease" : import.meta.env["VITE_NETEASE_API_URL"]);

// 基础配置
const server: AxiosInstance = axios.create({
  baseURL,
  // 允许跨域
  withCredentials: true,
  // 超时时间
  timeout: 15000,
});

// 基础配置
const serverHemusic: AxiosInstance = axios.create({
  baseURL: API_URL,
  // 允许跨域
  withCredentials: true,
  // 超时时间
  timeout: 15000,
});

// 请求拦截器
serverHemusic.interceptors.request.use(
  (request) => {
    // pinia
    const settingStore = useSettingStore();
    if (!request.params) request.params = {};
    if (isLogin()) {
      const token = useDataStore().token;
      request.headers.set("Authorization", "Bearer " + token);
    }
    request.headers.set("Accept-Language", `${settingStore.language};q=0.9`);
    // proxy
    if (settingStore.proxyProtocol !== "off") {
      const protocol = settingStore.proxyProtocol.toLowerCase();
      const server = settingStore.proxyServe;
      const port = settingStore.proxyPort;
      const proxy = `${protocol}://${server}:${port}`;
      if (proxy) request.params.proxy = proxy;
    }
    // 发送请求
    return request;
  },
  (error: AxiosError) => {
    console.error("请求发送失败：", error);
    return Promise.reject(error);
  },
);

// 响应拦截器
serverHemusic.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const { response } = error;
    // 状态码处理
    switch (response?.status) {
      case 400:
        console.error("客户端错误：", response.status, response.statusText);
        // 执行客户端错误的处理逻辑
        break;
      case 401:
        console.error("未授权：", response.status, response.statusText);
        useDataStore().userLoginStatus = false;
        openUserLogin();
        break;
      case 403:
        console.error("禁止访问：", response.status, response.statusText);
        if (response && (response.data as { reason?: string }).reason === "CAPTCHA_REQUIRED") {
          const { metadata } = response.data as { metadata: { scene: string; meta: string } };
          // 等待验证码验证
          const captchaSuccess = await openCaptcha(Number(metadata.scene), metadata.meta);

          if (captchaSuccess) {
            console.log("验证码验证成功，自动重试原请求");
            // 重新发送原始请求
            const originalConfig = error.config;
            if (originalConfig) {
              try {
                return await serverHemusic.request(originalConfig); // 返回重试成功的响应
              } catch (retryError) {
                console.error("重试请求失败：", retryError);
                return Promise.reject(retryError);
              }
            }
          } else {
            console.log("验证码验证失败或取消");
          }
        }

        console.log("结束了吗");
        // 执行禁止访问的处理逻辑
        break;
      case 404:
        console.error("未找到资源：", response.status, response.statusText);
        // 执行未找到资源的处理逻辑
        break;
      case 500:
        console.error("服务器错误：", response.status, response.statusText);
        // 执行服务器错误的处理逻辑
        break;
      default:
        // 处理其他状态码或错误条件
        console.error("未处理的错误：", error.message);
    }

    window.$message.error(
      (response && (response.data as { message?: string }).message) || error.message,
    );
    return Promise.reject(error);
  },
);

// 请求
const request = async (config: AxiosRequestConfig): Promise<any> => {
  // 返回请求数据
  const { data } = await server.request(config);
  return data as any;
};

export const requestHemusic = async (config: AxiosRequestConfig): Promise<any> => {
  // 返回请求数据
  const { data } = await serverHemusic.request(config);
  return data as any;
};

export default request;
