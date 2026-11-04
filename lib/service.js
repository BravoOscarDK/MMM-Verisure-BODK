"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const sessionPath = path.join(root, "session.json");

function saveSession(email, cookies) {
  const temporary = sessionPath + ".tmp";
  fs.writeFileSync(temporary, JSON.stringify({ email, cookies }, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, sessionPath);
}

const fields = {
  armState: "armState { statusType date }",
  climates: "climates { device { area deviceLabel } temperatureValue temperatureTimestamp humidityEnabled humidityValue humidityTimestamp }",
  doorWindows: "doorWindows { device { area deviceLabel } state reportTime }"
};

class Service {
  constructor(Client) { this.Client = Client; this.persist = saveSession; }
  async read(config) {
    if (!this.client) {
      const saved = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
      if (!saved.email || !Array.isArray(saved.cookies) || !saved.cookies.length) throw new Error("session");
      this.client = new this.Client(saved.email, null, saved.cookies);
      this.email = saved.email;
    }
    const installations = await this.client.getInstallations();
    const installation = config.installationId
      ? installations.find(item => item.giid === config.installationId) : installations[0];
    if (!installation) throw new Error("installation");
    const keys = ["armState", ...(config.showClimate ? ["climates"] : []), ...(config.showContacts ? ["doorWindows"] : [])];
    const result = { alias: installation.config.alias || "Verisure", updated: Date.now(), warnings: [] };
    for (const key of keys) {
      try {
        const response = await installation.client({
          operationName: "MirrorStatus",
          query: `query MirrorStatus($giid: String!) { installation(giid: $giid) { ${fields[key]} } }`
        });
        if (!response.installation) throw new Error("missing");
        result[key] = response.installation[key] ?? (key === "armState" ? null : []);
        if (key === "armState" && !result[key]) result.warnings.push(key);
      } catch { result.warnings.push(key); }
    }
    this.persist(this.email, this.client.cookies);
    if (result.warnings.length === keys.length) throw new Error("unavailable");
    return result;
  }
}
module.exports = { Service, saveSession };
