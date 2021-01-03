import { Client, MessageReaction } from "discord.js";
import config from "../../config";

export async function onReactionAdd(client: Client, reaction: MessageReaction) {
  if (reaction.emoji.name !== '📌') {
    return;
  }

  if ((reaction.count || 0) !== config.pinByReaction.threshold) {
    // Trigger on rising edge
    return;
  }

  console.log(`📌 Pin by reaction: '${reaction.message.id}' will be pinned!`);

  await reaction.message.pin();
}
