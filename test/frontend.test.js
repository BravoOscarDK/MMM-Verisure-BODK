"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

test("routes instances separately and renders stale data and remote names as text", () => {
  let module;
  const document = { createElement: () => ({ children: [], append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); } }) };
  vm.runInNewContext(fs.readFileSync(require.resolve("../MMM-Verisure-BODK.js"), "utf8"), {
    Module: { register: (name, definition) => { module = definition; } }, document
  });
  module.identifier = "one"; module.config = module.defaults; module.updateDom = () => {};
  module.start();
  module.socketNotificationReceived("VERISURE_DATA", { id: "two", data: { alias: "other" } });
  assert.equal(module.data, null);
  module.socketNotificationReceived("VERISURE_DATA", { id: "one", data: { alias: "<img onerror=alert(1)>", updated: Date.now() } });
  module.socketNotificationReceived("VERISURE_ERROR", { id: "one", message: "Offline" });
  const dom = module.getDom();
  const texts = dom.children.flatMap(row => row.children.map(child => child.textContent));
  assert.ok(texts.includes("<img onerror=alert(1)>"));
  assert.ok(texts.includes("Unknown alarm status"));
  assert.ok(texts.includes("Last fetched (stale data)"));
});
