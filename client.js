import { uIOhook, UiohookKey } from "uiohook-napi";
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
  console.log("Recieved Ping Event");
  socket.pong();
});

var curdown = null;
const keys = {};

Object.keys(UiohookKey).forEach((key) => {
  keys[UiohookKey[key]] = key;
});

socket.once("open", () => {
  console.log(`[WS] Connected`);
});

uIOhook.on("keydown", (e) => {
  if (e.keycode == curdown) return;

  var key = "";
  if (e.ctrlKey) key += "Ctrl+";
  if (e.altKey) key += "Alt+";
  if (e.shiftKey) key += keys[e.keycode].toUpperCase();
  else key += keys[e.keycode].toLowerCase();

  sendEvent({ event: "down", keycode: e.keycode, key: keys[e.keycode] });

  console.log({ event: "keydown", keycode: e.keycode, key: key });
  curdown = e.keycode;
});

uIOhook.on("keyup", (e) => {
  sendEvent({ event: "up", keycode: e.keycode, key: keys[e.keycode] });
  console.log({ event: "keyup", e, key: keys[e.keycode] });
  curdown = null;
});

function sendEvent(data) {
  socket.send(JSON.stringify(data));
}

uIOhook.start();
