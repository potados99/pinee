import config from "../config";
import Discord from "discord.js";
import { onReady } from "./routes/ready";
import { onMessage } from "./routes/message";
import { onReactionAdd } from "./routes/reaction";
import { onMessageUpdate } from "./routes/update";
import { messagesFetched, reactionsFetched } from "./utils/message";

export default async function startBot() {
  const client = new Discord.Client({ partials: ["MESSAGE", "REACTION"]/*메시지(MESSAGE)와 리액션(REACTION)에 대해 변화를 감지합니다.*/ });

  client.on("ready", async () => {
    await onReady(client);
  });

  client.on("message", async (message) => {
    await onMessage(client, message);
  });

  client.on("messageUpdate", async (rawBefore, rawAfter) => {
    const [before, after] = await messagesFetched(rawBefore, rawAfter);

    await onMessageUpdate(client, before, after);
  });

  client.on("messageReactionAdd", async (rawReaction) => {
    const [reaction] = await reactionsFetched(rawReaction);

    await onReactionAdd(reaction);
  });

  await client.login(config.services.discord.bot.auth.token);
}
