"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

test("network failures keep retrying, reload the session and recover", async () => {
  let definition, attempts = 0, instances = 0, next = 0;
  const timers = new Map(), messages = [];
  class Service {
    constructor() { instances++; }
    async read() { if (++attempts <= 8) throw new Error("offline"); return { updated: 1 }; }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../node_helper.js"), "utf8"), {
    require: name => name === "node_helper" ? { create: value => { definition = value; return value; } }
      : name === "verisure" ? {} : { Service },
    module: {}, console: { warn() {} },
    setTimeout: (fn, delay) => { timers.set(++next, { fn, delay }); return next; },
    clearTimeout: id => timers.delete(id)
  });
  const app = Object.assign({}, definition, { sendSocketNotification: (type, payload) => messages.push({ type, payload }) });
  app.start();
  app.socketNotificationReceived("VERISURE_START", { id: "a", config: { updateInterval: 60000 } });
  await app.queue;
  for (let i = 0; i < 8; i++) {
    const [id, timer] = [...timers][0];
    assert.ok(timer.delay <= 300000);
    timers.delete(id); timer.fn(); await app.queue;
  }
  assert.equal(instances, 9);
  assert.equal(messages.at(-1).type, "VERISURE_DATA");
  assert.equal([...timers.values()][0].delay, 60000);
  app.stop();
  assert.equal(timers.size, 0);
});
