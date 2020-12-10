import { Client } from "discord.js";

export async function onReady(client: Client) {
  console.log(`Bot connected at ${new Date().toISOString()}`);
}
