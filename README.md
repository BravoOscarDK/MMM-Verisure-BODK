# MMM-Verisure-BODK

A MagicMirror² module displaying Verisure alarm status, temperature, humidity, and door/window contacts in English. Available information depends on the devices and data exposed by your installation. Sensor values are the latest reported readings and may not be live.

The module reads status only. It cannot arm or disarm the alarm or unlock doors. It does not replace the Verisure app or alarm monitoring.

## Requirements and API

- MagicMirror² running Node.js 22 or later, with internet access.
- A Verisure account for the Nordic Verisure service, including Danish installations. Services in other countries may use a different API.
- The unofficial [node-verisure](https://github.com/ptz0n/node-verisure) library provides access to Verisure's cloud API without web scraping. This module is not affiliated with Verisure. Changes to the service may require updates.

## Installation

Place the complete folder at `MagicMirror/modules/MMM-Verisure-BODK`, then run these commands in the module folder:

```sh
npm install
npm run login
```

The login wizard asks for your email and password. Your password is hidden and is not saved. If Verisure requires two-factor authentication, enter the one-time code in the terminal. Keep two-factor authentication enabled. The wizard lists the names and IDs of your installations.

The session is saved locally in `session.json` and reused/refreshed during requests. This file grants account access: protect it like a password, do not share it, and keep it out of Git. On Linux, the file is created with permissions 0600; Windows protection depends on the folder's access permissions. Run the login wizard as the same user that runs MagicMirror. If the session expires or is revoked, run `npm run login` again and restart MagicMirror.

Add the following entry to `modules` in `MagicMirror/config/config.js`:

```js
{
  module: "MMM-Verisure-BODK",
  position: "top_right",
  header: "Verisure",
  config: {
    installationId: "",
    updateInterval: 300000,
    showClimate: true,
    showContacts: true,
    animationSpeed: 500
  }
},
```

Restart MagicMirror after setup or configuration changes.

## Configuration

| Option | Default | Description |
| --- | --- | --- |
| `installationId` | `""` | Selects the first installation. Enter an ID from the login wizard to select a specific installation. |
| `updateInterval` | `300000` | Milliseconds between updates; minimum 60000, maximum 3600000. |
| `showClimate` | `true` | Shows temperature and humidity where available. |
| `showContacts` | `true` | Shows door/window contacts where available. |
| `animationSpeed` | `500` | Display animation duration in milliseconds. |

Multiple module instances can display different installations on the same account. They share a login session. Do not put your email, password, or cookies in the MagicMirror configuration or share them in chat. Only display data is sent from the node helper to the mirror.

All built-in messages and date formatting use English. Installation names and sensor names are displayed as returned by Verisure.

## Troubleshooting and validation

- Missing session: run `npm run login` in the module folder.
- Login or connection failure: check the Verisure app and your internet connection. Then try logging in again and restart MagicMirror.
- Unknown alarm status means the API did not return a recognized status. It is not treated as disarmed.
- Partial API failures display a warning. On a complete failure, the last result remains visible and is marked as stale. Retries use an increasing interval, up to one hour.
- Sensors that are absent or returned as null are not displayed.
- No alarm PIN is required.

Run `npm test` for local tests using a simulated API without accessing your account. Verify actual login and sensor data on your own mirror after installation.

## Files

`MMM-Verisure-BODK.js`, `MMM-Verisure-BODK.css`, `node_helper.js`, `package.json`, `package-lock.json`, `config.example.js`, `scripts/login.js`, `lib/service.js`, tests, `.gitignore`, this README, and the MIT license.
