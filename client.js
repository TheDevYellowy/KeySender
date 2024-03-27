import * as gkm from "gkm";
import { WebSocket } from "ws";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { Service } from "node-windows";

const __dirname = dirname(fileURLToPath(import.meta.url));

// const svc = new Service({
//   name: "Key Sender",
//   description: "You know what this is",
//   script: `${__dirname}/client.js`,
//   scriptOptions: "192.168.0.103",
//   nodeOptions: ["--harmony", "--max_old_space_size=4096"],
// });

// svc.on("install", () => {
//   svc.start();
//   process.exit();
// });

// svc.install();

const serverIp = process.argv[2];
const socket = new WebSocket(`ws://${serverIp}:1596`);

socket.on("ping", () => {
  // console.log("Recieved Ping Event");
  socket.pong();
});

var curdown = null;

socket.once("open", () => {
  console.log(`[WS] Connected`);
});

gkm.events.on("key.*", (data) => {
  const event = gkm.events.event.split(".")[1];
  if (event == "typed") return;
  const key = data[0].toLowerCase();

  if (event == "pressed") {
    if (key == curdown) return;
    sendEvent({ event: "down", key });
    curdown = key;
  } else {
    sendEvent({ event: "up", key });
    curdown = null;
  }
});

gkm.events.on("mouse.*", (data) => {
  const event = gkm.events.event.split(".")[1];
  if (data[0].includes(",")) {
    const [x, y] = data[0].split(",");
    sendEvent({ event: "mouseMove", x, y });
  } else {
    if (event == "clicked") return;
    let button;
    switch (data[0]) {
      case "1":
        button = "left";
        break;
      case "2":
        button = "right";
        break;
      case "3":
        button = "middle";
        break;
    }

    sendEvent({ event: "mouseClick", button });
  }
});

function sendEvent(data) {
  socket.send(JSON.stringify(data));
}
