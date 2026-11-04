"use strict";
const readline = require("node:readline/promises");
const { Writable } = require("node:stream");
const Verisure = require("verisure");
const { saveSession } = require("../lib/service");

async function main() {
  if (!process.stdin.isTTY) throw new Error("terminal");
  let hidden = false;
  const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk); callback(); } });
  output.isTTY = true;
  const prompt = readline.createInterface({ input: process.stdin, output, terminal: true });
  try {
    const email = (await prompt.question("Verisure username (email): ")).trim();
    process.stdout.write("Password (hidden): ");
    hidden = true;
    const password = await prompt.question("");
    hidden = false; process.stdout.write("\n");
    const client = new Verisure(email, password);
    await client.getToken();
    if (client.getCookie("vs-stepup")) {
      const code = (await prompt.question("One-time code from Verisure: ")).trim();
      await client.getToken(code);
    }
    const installations = await client.getInstallations();
    saveSession(email, client.cookies);
    console.log("Login saved to session.json. Installations:");
    for (const item of installations) console.log(`${item.config.alias || "Installation"}: ${item.giid}`);
  } finally { hidden = false; prompt.close(); }
}
main().catch(() => { console.error("Login failed. Check your credentials, one-time code and connection. Use an interactive terminal."); process.exitCode = 1; });
