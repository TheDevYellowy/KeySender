import { WebSocketServer } from "ws";
import robot from "robotjs";

import { Service, EventLogger } from "node-windows";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const option = process.argv[2];
const keys = ["v"];
var copy_mouse = false;

if (option == "ns") {
  var svc = null;
} else {
  var svc = new Service({
    name: "Key Sender Server",
    description: "You know what this is",
    script: `${__dirname}/server.js`,
    nodeOptions: ["--harmony", "--max_old_space_size=4096"],
  });

  console.log = (text) => {
    log.info(text);
  };

  console.warn = (text) => {
    log.warn(text);
  };

  console.error = (text) => {
    log.error(text);
  };
}

const log = new EventLogger("Key Sender Server");

svc?.on("install", () => {
  svc.start();
  process.exit();
});

svc?.install();

const server = new WebSocketServer({ port: 1596 });
var interval = null;

function startPingPong(s) {
  s.ping();
  let x = setTimeout(() => {
    s.close();
    console.warn(`Closing Zombie Connection`);
    clearInterval(interval);
  }, 10_000);

  s.once("pong", () => {
    console.log("Recieved Pong Event");
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
      if (json.key == "f10") copy_mouse = !copy_mouse;

      if (copy_mouse) {
        switch (json.event) {
          case "mouseMove":
            robot.moveMouse(json.x, json.y);
            break;
          case "mouseClick":
            robot.mouseClick(json.button);
            break;
        }
      } else {
        if (json.event.includes("mouse")) return;
        if (keys.includes(json.key)) robot.keyToggle(json.key, json.event);
      }
    } catch (e) {
      console.error(e);
    }
  });
});
