import { Client, MessageReaction } from "discord.js";
import config from "../../config";
import PinByReactionResponder from "../responder/PinByReactionResponder";

export async function onReactionAdd(client: Client, reaction: MessageReaction) {
  if (reaction.emoji.name !== '📌') {
    return;
  }

  if ((reaction.count || 0) !== config.pinByReaction.threshold) {
    // Trigger on rising edge
    return;
  }

  console.log(`📌 Pin by reaction: '${reaction.message.id}' will be pinned!`);

  await new PinByReactionResponder(client, reaction).handle();
}
