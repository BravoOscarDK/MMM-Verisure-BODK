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
  // MagicMirror owns data: file() and getHeader() must keep working after start.
  const metadata = { path: "modules/MMM-Verisure-BODK", header: "Verisure", position: "top_right" };
  module.data = metadata;
  module.file = name => `${module.data.path}/${name}`;
  module.getHeader = () => module.data.header;
  module.start();
  assert.strictEqual(module.data, metadata);
  assert.equal(module.file(module.getStyles()[0]), "modules/MMM-Verisure-BODK/MMM-Verisure-BODK.css");
  assert.equal(module.getHeader(), "Verisure");
  assert.ok(module.getDom());
  module.socketNotificationReceived("VERISURE_DATA", { id: "two", data: { alias: "other" } });
  assert.equal(module.reading, null);
  module.socketNotificationReceived("VERISURE_DATA", { id: "one", data: { alias: "<img onerror=alert(1)>", updated: Date.now() } });
  module.socketNotificationReceived("VERISURE_ERROR", { id: "one", message: "Offline" });
  assert.strictEqual(module.data, metadata);
  const dom = module.getDom();
  const texts = dom.children.flatMap(row => row.children.map(child => child.textContent));
  assert.ok(texts.includes("<img onerror=alert(1)>"));
  assert.ok(texts.includes("Unknown alarm status"));
  assert.ok(texts.includes("Last fetched (stale data)"));
});
