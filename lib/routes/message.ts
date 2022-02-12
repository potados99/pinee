import { Message } from "discord.js";
import { isByThisBot, isFromDm } from "../utils/message";
import DmResponder from "../responder/DmResponder";

export async function onMessage(message: Message) {
  if (isByThisBot(message.client, message)) {
    return;
  }

  if (isFromDm(message)) {
    console.log(`새 DM 이벤트: '${message.content}'`);

    await new DmResponder(message).handle();
    return;
  }
}
