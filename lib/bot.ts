import Discord from "discord.js";
import { onReady } from "./routes/ready";
import { onMessage } from "./routes/message";
import { onMessageUpdate } from "./routes/update";
import config from "../config";
import { onReactionAdd } from "./routes/reaction";
import { messagesFetched, reactionsFetched } from "./utils/message";

export default async function startBot() {
  const client = new Discord.Client({ partials: ["MESSAGE", "REACTION"] }); // Listen for changes(update, reaction) on previous messages.

  client.on("ready", async () => {
    await onReady(client);
  });

  client.on("message", async (message) => {
    await onMessage(message);
  });

  client.on("messageUpdate", async (rawBefore, rawAfter) => {
    const [before, after] = await messagesFetched(rawBefore, rawAfter);

    await onMessageUpdate(client, before, after);
  });

  client.on("messageReactionAdd", async (rawReaction) => {
    const [reaction] = await reactionsFetched(rawReaction);

    await onReactionAdd(reaction);
  });

  await client.login(config.auth.token);
}
