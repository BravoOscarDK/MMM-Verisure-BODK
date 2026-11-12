/* global Module */
Module.register("MMM-Verisure-BODK", {
  text(key) {
    const texts = {
      "en": {
        "Loading Verisure …": "Loading Verisure …",
        "Disarmed": "Disarmed",
        "Armed home": "Armed home",
        "Armed away": "Armed away",
        "Armed night": "Armed night",
        "Changing status …": "Changing status …",
        "Unknown alarm status": "Unknown alarm status",
        "Sensor": "Sensor",
        "Door/window": "Door/window",
        "Open": "Open",
        "Closed": "Closed",
        "Unknown": "Unknown",
        "Some information is unavailable": "Some information is unavailable",
        "Last fetched (stale data)": "Last fetched (stale data)",
        "Fetched": "Fetched",
        "Sensors show their latest reported readings": "Sensors show their latest reported readings"
      },
      "da": {
        "Loading Verisure …": "Indlæser Verisure …",
        "Disarmed": "Frakoblet",
        "Armed home": "Tilkoblet hjemme",
        "Armed away": "Tilkoblet ude",
        "Armed night": "Tilkoblet nat",
        "Changing status …": "Skifter status …",
        "Unknown alarm status": "Ukendt alarmstatus",
        "Sensor": "Sensor",
        "Door/window": "Dør/vindue",
        "Open": "Åben",
        "Closed": "Lukket",
        "Unknown": "Ukendt",
        "Some information is unavailable": "Nogle oplysninger er utilgængelige",
        "Last fetched (stale data)": "Senest hentet (forældede data)",
        "Fetched": "Hentet",
        "Sensors show their latest reported readings": "Sensorer viser deres senest rapporterede målinger"
      }
    };
    const language = String(this.config.language || "en").toLowerCase().split(/[-_]/)[0];
    return (Object.hasOwn(texts, language) ? texts[language] : texts.en)[key] || texts.en[key] || key;
  },
  defaults: {
    language: "en", installationId: "", updateInterval: 300000, showClimate: true, showContacts: true, animationSpeed: 500 },
  getStyles() { return ["MMM-Verisure-BODK.css"]; },
  start() { this.reading = null; this.error = ""; },
  notificationReceived(notification) {
    if (notification === "DOM_OBJECTS_CREATED") this.sendSocketNotification("VERISURE_START", {
      id: this.identifier,
      config: { installationId: this.config.installationId, updateInterval: this.config.updateInterval,
        showClimate: this.config.showClimate, showContacts: this.config.showContacts }
    });
  },
  socketNotificationReceived(notification, payload) {
    if (!payload || payload.id !== this.identifier) return;
    if (notification === "VERISURE_DATA") { this.reading = payload.data; this.error = ""; }
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
    if (!this.reading) { if (!this.error) add("", this.text("Loading Verisure …"), "dimmed"); return wrapper; }
    const data = this.reading;
    const states = { DISARMED: this.text("Disarmed"), ARMED_HOME: this.text("Armed home"), ARMED_AWAY: this.text("Armed away"), ARMED_NIGHT: this.text("Armed night"), CHANGE_IN_PROGRESS: this.text("Changing status …") };
    add(data.alias, states[data.armState?.statusType] || this.text("Unknown alarm status"), "bright");
    if (this.config.showClimate) for (const sensor of data.climates || []) {
      const temperature = sensor.temperatureValue == null ? "—" : `${sensor.temperatureValue} °C`;
      const humidity = sensor.humidityEnabled && sensor.humidityValue != null ? ` · ${sensor.humidityValue} %` : "";
      add(sensor.device?.area || sensor.device?.deviceLabel || this.text("Sensor"), temperature + humidity);
    }
    if (this.config.showContacts) for (const sensor of data.doorWindows || []) {
      add(sensor.device?.area || sensor.device?.deviceLabel || this.text("Door/window"), { OPEN: this.text("Open"), CLOSE: this.text("Closed"), CLOSED: this.text("Closed") }[sensor.state] || this.text("Unknown"));
    }
    if (data.warnings?.length) add("", this.text("Some information is unavailable"), "verisure-warning");
    add(this.error ? this.text("Last fetched (stale data)") : this.text("Fetched"), new Date(data.updated).toLocaleString(String(this.config.language).toLowerCase().startsWith("da") ? "da-DK" : "en-GB"), "dimmed xsmall");
    add("", this.text("Sensors show their latest reported readings"), "dimmed xsmall");
    return wrapper;
  }
});
