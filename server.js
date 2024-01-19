import { WebSocketServer } from "ws";
import { keyboard } from "@nut-tree/nut-js";
// import { UiohookKey } from "uiohook-napi";

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

console.log = (text) => {
  log.info(text);
};

console.warn = (text) => {
  log.warn(text);
};

console.error = (text) => {
  log.error(text);
};

function startPingPong(s) {
  s.ping();
  let x = setTimeout(() => {
    s.close();
    log.warn(`Closing Zombie Connection`);
    clearInterval(interval);
  }, 10_000);

  s.once("pong", () => {
    log.info("Recieved Pong Event");
    clearTimeout(x);
  });
}

server.on("connection", (socket, req) => {
  interval = setInterval(() => {
    startPingPong(socket);
  }, 10_000);

  socket.on("message", async (data) => {
    try {
      const str = data.toString();
      const json = JSON.parse(str);
      log.info(`Recieved message event\n${JSON.stringify(json, null, 2)}`);
      switch (json.message) {
        case "keydown":
          await keyboard.pressKey(json.keycode);
          break;
        case "keyup":
          await keyboard.releaseKey(json.keycode);
          break;
      }
    } catch (e) {}
  });
});
