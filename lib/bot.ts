import Discord, { Message } from "discord.js";
import { onReady } from "./routes/ready";
import { onMessage } from "./routes/message";
import { onMessageUpdate } from "./routes/update";
import config from "../config";
import { onReactionAdd } from "./routes/reaction";

export default async function startBot() {
  const client = new Discord.Client({ partials: ["MESSAGE", "REACTION"] }); // Listen for changes(update, reaction) on previous messages.

  client.on("ready", async () => {
    await onReady(client);
  });

  client.on("message", async (message) => {
    await onMessage(client, message);
  });

  client.on("messageUpdate", async (before, after) => {
    if (before.partial) await before.fetch();
    if (after.partial) await after.fetch();

    await onMessageUpdate(client, before as Message, after as Message);
  });

  client.on("messageReactionAdd", async (reaction) => {
    if (reaction.partial) await reaction.fetch();

    await onReactionAdd(client, reaction);
  });

  await client.login(config.auth.token);
}
