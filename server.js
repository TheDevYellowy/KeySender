import { WebSocketServer } from "ws";
import { uIOhook } from "uiohook-napi";

import { Service, EventLogger } from "node-windows";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const svc = new Service({
  name: "Key Sender Server",
  description: "You know what this is",
  script: `${__dirname}/server.js`,
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

const log = new EventLogger("Key Sender Server");

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
    log.warn(`Closing Zombie Connection`);
    clearInterval(interval);
  });

  s.once("pong", () => {
    log.info("Recieved Pong Event");
    clearTimeout(x);
  });
}

server.on("connection", (socket, req) => {
  interval = setInterval(() => {
    startPingPong(socket);
  }, 10000);

  socket.on("message", async (data) => {
    try {
      const str = data.toString();
      const json = JSON.parse(data.toString());
      log.info(`Recieved message event\n${JSON.stringify(str, null, 2)}`);
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
