import { WebSocketServer } from "ws";
import { uIOhook } from "uiohook-napi";

import { Service } from "node-windows";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: "Key Sender Server",
  description: "You know what this is",
  script: `${__dirname}/server.js`,
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

svc.on("install", () => {
  svc.start();
  process.exit();
});

svc.install();

const server = new WebSocketServer({ port: 1596 });
var interval = null;

function startPingPong(s) {
  s.ping();
  let x = setTimeout(() => {
    s.close();
    console.log(`Closing Zombie Connection`);
    clearInterval(interval);
  });

  s.once("pong", () => clearTimeout(x));
}

server.on("connection", (socket, req) => {
  interval = setInterval(() => {
    startPingPong(socket);
  }, 10000);

  socket.on("message", (data) => {
    try {
      const json = JSON.parse(data);
      switch (json.message) {
        case "keydown":
          uIOhook.keyToggle(json.keycode, "down");
          break;
        case "keyup":
          uIOhook.keyToggle(json.keycode, "up");
          break;
      }
    } catch (e) {}
  });
});
