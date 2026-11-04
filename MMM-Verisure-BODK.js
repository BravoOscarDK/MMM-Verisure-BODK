/* global Module */
Module.register("MMM-Verisure-BODK", {
  defaults: { installationId: "", updateInterval: 300000, showClimate: true, showContacts: true, animationSpeed: 500 },
  getStyles() { return ["MMM-Verisure-BODK.css"]; },
  start() { this.data = null; this.error = ""; },
  notificationReceived(notification) {
    if (notification === "DOM_OBJECTS_CREATED") this.sendSocketNotification("VERISURE_START", {
      id: this.identifier,
      config: { installationId: this.config.installationId, updateInterval: this.config.updateInterval,
        showClimate: this.config.showClimate, showContacts: this.config.showContacts }
    });
  },
  socketNotificationReceived(notification, payload) {
    if (!payload || payload.id !== this.identifier) return;
    if (notification === "VERISURE_DATA") { this.data = payload.data; this.error = ""; }
    else if (notification === "VERISURE_ERROR") this.error = payload.message;
    else return;
    this.updateDom(this.config.animationSpeed);
  },
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "verisure-bodk small";
    const add = (label, value, className = "") => {
      const row = document.createElement("div"); row.className = `verisure-row ${className}`;
      const left = document.createElement("span"); left.textContent = label;
      const right = document.createElement("span"); right.textContent = value;
      row.append(left, right); wrapper.appendChild(row);
    };
    if (this.error) add("", this.error, "verisure-warning");
    if (!this.data) { if (!this.error) add("", "Loading Verisure …", "dimmed"); return wrapper; }
    const data = this.data;
    const states = { DISARMED: "Disarmed", ARMED_HOME: "Armed home", ARMED_AWAY: "Armed away", ARMED_NIGHT: "Armed night", CHANGE_IN_PROGRESS: "Changing status …" };
    add(data.alias, states[data.armState?.statusType] || "Unknown alarm status", "bright");
    if (this.config.showClimate) for (const sensor of data.climates || []) {
      const temperature = sensor.temperatureValue == null ? "—" : `${sensor.temperatureValue} °C`;
      const humidity = sensor.humidityEnabled && sensor.humidityValue != null ? ` · ${sensor.humidityValue} %` : "";
      add(sensor.device?.area || sensor.device?.deviceLabel || "Sensor", temperature + humidity);
    }
    if (this.config.showContacts) for (const sensor of data.doorWindows || []) {
      add(sensor.device?.area || sensor.device?.deviceLabel || "Door/window", { OPEN: "Open", CLOSE: "Closed", CLOSED: "Closed" }[sensor.state] || "Unknown");
    }
    if (data.warnings?.length) add("", "Some information is unavailable", "verisure-warning");
    add(this.error ? "Last fetched (stale data)" : "Fetched", new Date(data.updated).toLocaleString("en-GB"), "dimmed xsmall");
    add("", "Sensors show their latest reported readings", "dimmed xsmall");
    return wrapper;
  }
});
