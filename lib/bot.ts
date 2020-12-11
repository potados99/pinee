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
    await onMessage(client, message);
  });

  client.on("messageUpdate", async (before, after) => {
    const beforeFetched = before.partial ? await before.fetch() : before;
    const afterFetched = after.partial ? await after.fetch() : after;

    await onMessageUpdate(
      client,
      beforeFetched,
      afterFetched
    );
  });

  if (await client.login(config.auth.token) !== config.auth.token) {
    throw Error("Login failed!");
  } else {
    console.log("Login succeeded.");
  }
}
