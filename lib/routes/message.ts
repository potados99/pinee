import { log } from "../utils/logging";
import { Message } from "discord.js";
import DmResponder from "../responder/DmResponder";
import MentionResponder from "../responder/MentionResponder";
import { isByThisBot, isFromDm, isMentioningThisBot } from "../utils/message";

export async function onMessage(message: Message) {
  if (isByThisBot(message.client, message)) {
    return;
  }

  if (isFromDm(message)) {
    log(`새 DM 이벤트: '${message.content}'`);

    await new DmResponder(message).handle();
    return;
  }

  if (isMentioningThisBot(message.client, message)) {
    log(`새 Mention 이벤트: ${message.cleanContent}`);

    await new MentionResponder(message).handle();
    return;
  }
}
