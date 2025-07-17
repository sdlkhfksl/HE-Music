// 取消收藏歌单
import { requestHemusic } from "@/utils/request";

export const authProviders = () => {
  return requestHemusic({
    url: "/v1/auth/providers",
    method: "get",
  });
};
export const authCodeURL = (provider: string, redirect_uri: string) => {
  return requestHemusic({
    url: "/v1/auth/code/url",
    method: "get",
    params: { provider, redirect_uri },
  });
};
