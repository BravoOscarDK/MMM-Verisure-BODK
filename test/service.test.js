"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Service } = require("../lib/service");

function service(failed = []) {
  const instance = new Service();
  instance.client = {
    getInstallations: async () => [{ giid: "home", config: { alias: "Home" }, client: async ({ query }) => {
      const key = ["armState", "climates", "doorWindows"].find(name => query.includes(name));
      if (failed.includes(key)) throw new Error("API failure with sensitive body");
      return { installation: { [key]: key === "armState" ? { statusType: "ARMED_AWAY" } : null } };
    } }], cookies: []
  };
  return instance;
}

// Inject persistence so these tests never overwrite a user's session.
test("normalizes absent sensors and retains alarm status", async () => {
  const instance = service(); instance.persist = () => {};
  const result = await instance.read({ showClimate: true, showContacts: true });
  assert.equal(result.armState.statusType, "ARMED_AWAY");
  assert.deepEqual(result.climates, []);
  assert.deepEqual(result.doorWindows, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(JSON.stringify(result).includes("cookies"), false);
});
test("isolates failed device families", async () => {
  const instance = service(["climates"]); instance.persist = () => {};
  const result = await instance.read({ showClimate: true, showContacts: true });
  assert.deepEqual(result.warnings, ["climates"]);
  assert.equal(result.armState.statusType, "ARMED_AWAY");
});
test("rejects unknown installation and complete API failure", async () => {
  const instance = service(["armState"]); instance.persist = () => {};
  await assert.rejects(instance.read({ installationId: "wrong" }), /installation/);
  await assert.rejects(instance.read({}), /unavailable/);
});
