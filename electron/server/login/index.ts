import { FastifyInstance } from "fastify";
import mainWindow from "../../main/windows/main-window";
import { serverLog } from "../../main/logger";

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

// 初始化 登录回调
export const initLoginAPI = async (fastify: FastifyInstance) => {
  fastify.get("/success", async (req, reply) => {
    const { token } = req.query as { token?: string };
    if (!token) {
      reply.type("text/html").send(loginFailTxt);
      return;
    }
    const mainWin = mainWindow.getWin();
    mainWin?.webContents.send("login-success", { token });
    reply.type("text/html").send(loginSuccessTxt);
  });

  serverLog.info("🌐 Register LoginAPI successfully");
};
