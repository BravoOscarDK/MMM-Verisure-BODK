"use strict";
const NodeHelper = require("node_helper");
const Verisure = require("verisure");
const { Service } = require("./lib/service");

module.exports = NodeHelper.create({
  start() { this.entries = new Map(); this.stopped = false; this.queue = Promise.resolve(); },
  socketNotificationReceived(notification, payload) {
    if (notification !== "VERISURE_START" || !payload || typeof payload.id !== "string") return;
    if (this.entries.has(payload.id)) return;
    const config = payload.config || {};
    const entry = { id: payload.id, config: {
      installationId: typeof config.installationId === "string" ? config.installationId : "",
      showClimate: config.showClimate !== false, showContacts: config.showContacts !== false
    }, interval: Math.max(60000, Math.min(3600000, Number(config.updateInterval) || 300000)), failures: 0 };
    this.entries.set(entry.id, entry);
    this.poll(entry);
  },
  poll(entry) {
    this.queue = this.queue.then(async () => {
      if (this.stopped) return;
      try {
        this.service ||= new Service(Verisure);
        const data = await this.service.read(entry.config);
        entry.failures = 0;
        this.sendSocketNotification("VERISURE_DATA", { id: entry.id, data });
      } catch (error) {
        entry.failures++;
        const message = error.code === "ENOENT" ? "Run npm run login in the module folder."
          : error.message === "installation" ? "The selected installation was not found."
          : "Unable to fetch Verisure data. Check the connection or run npm run login again.";
        this.sendSocketNotification("VERISURE_ERROR", { id: entry.id, message });
      }
      if (!this.stopped) entry.timer = setTimeout(() => this.poll(entry), Math.min(3600000, entry.interval * 2 ** Math.min(entry.failures, 4)));
    });
  },
  stop() { this.stopped = true; for (const entry of this.entries.values()) clearTimeout(entry.timer); }
});
