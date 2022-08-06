import { log } from "../utils/logging";
import { MessageReaction } from "discord.js";
import config from "../../config";
import PinByReactionResponder from "../responder/PinByReactionResponder";

/**
 * 새로운 리액션이 추가되었을 때에
 * @param reaction
 */
export async function onReactionAdd(reaction: MessageReaction) {
  if (reaction.emoji.name !== '📌') {
    return;
  }

  if ((reaction.count || 0) !== config.behaviors.pinByReaction.pinCountThreshold) {
    // Trigger on rising edge
    return;
  }

  log(`📌 Pin by reaction: '${reaction.message.id}' will be pinned!`);

  await new PinByReactionResponder(reaction).handle();
}
