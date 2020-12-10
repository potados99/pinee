import Discord from "discord.js";
import { onReady } from "./routes/ready";
import { onMessage } from "./routes/message";
import { onMessageUpdate } from "./routes/update";
import config from "../config";

export default async function startBot() {

  const client = new Discord.Client({ partials: ["MESSAGE"] }); // Listen for changes on previous messages.

  client.on("ready", async () => {
    await onReady(client);
  });

  client.on("message", async (message) => {
    if (!message.guild) {
      console.log("DM not allowed!");
      return;
    }

    await onMessage(client, message);
  });

  client.on("messageUpdate", async (before, after) => {
    if (!after.guild) {
      console.log("DM not allowed!");
      return;
    }

    await onMessageUpdate(
      client,
      before.partial ? await before.fetch() : before,
      after.partial ? await after.fetch() : after
    );
  });

  if (await client.login(config.auth.token) !== config.auth.token) {
    throw Error("Login failed!");
  } else {
    console.log("Login succeeded.");
  }
}
