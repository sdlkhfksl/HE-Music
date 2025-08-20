import { join } from "path";
import { isDev } from "../main/utils";
import initNcmAPI from "./netease";
import initUnblockAPI from "./unblock";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import log from "../main/logger";
import { BrowserWindow } from "electron";

const loginFailTxt = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <title>Login Status</title>
  </head>
  <body>
    <h1>Login fail!</h1>
    <script>
      alert("Login fail!");
    </script>
  </body>
  </html>
`;

const loginSuccessTxt = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <title>Login Status</title>
  </head>
  <body>
    <h1>登录成功！</h1>
    <p>请手动关闭此窗口</p>
    <script>
      alert("登录成功！");
      window.close();
    </script>
  </body>
  </html>
`;

const initAppServer = async (getWin: () => { mainWin: BrowserWindow | null }) => {
  try {
    const server = Fastify({
      ignoreDuplicateSlashes: true, // 忽略尾随斜杠
    });

    // 注册插件
    server.register(fastifyCookie);
    server.register(fastifyMultipart);
    // 生产环境启用静态文件
    if (!isDev) {
      log.info("📂 Serving static files from /renderer");
      server.register(fastifyStatic, {
        root: join(__dirname, "../renderer"),
      });
    }
    // 声明
    server.get("/api", (_, reply) => {
      reply.send({
        name: "SPlayer API",
        description: "SPlayer API service",
        author: "@imsyy",
        list: [
          {
            name: "NeteaseCloudMusicApi",
            url: "/api/netease",
          },
          {
            name: "UnblockAPI",
            url: "/api/unblock",
          },
        ],
      });
    });
    // 注册接口
    server.register(initNcmAPI, { prefix: "/api" });
    server.register(initUnblockAPI, { prefix: "/api" });

    server.get("/login/success", async (req, reply) => {
      const { token } = req.query as { token?: string };
      if (!token) {
        reply.type("text/html").send(loginFailTxt);
        return;
      }
      getWin().mainWin?.webContents.send("login-success", { token });
      reply.type("text/html").send(loginSuccessTxt);
    });
    // 启动端口
    const port = Number(import.meta.env["VITE_SERVER_PORT"] || 25666);
    await server.listen({ port });
    log.info(`🌐 Starting AppServer on port ${port}`);
    return server;
  } catch (error) {
    log.error("🚫 AppServer failed to start");
    throw error;
  }
};

export default initAppServer;
