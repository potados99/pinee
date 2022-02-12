import { Message } from "discord.js";
import { isByThisBot, isFromDm, isMentioningThisBot } from "../utils/message";
import DmResponder from "../responder/DmResponder";
import MentionResponder from "../responder/MentionResponder";

export async function onMessage(message: Message) {
  if (isByThisBot(message.client, message)) {
    return;
  }

  if (isFromDm(message)) {
    console.log(`새 DM 이벤트: '${message.content}'`);

    await new DmResponder(message).handle();
    return;
  }

  if (isMentioningThisBot(message.client, message)) {
    console.log(`새 Mention 이벤트: ${message.cleanContent}`);

    await new MentionResponder(message).handle();
    return;
  }
}
