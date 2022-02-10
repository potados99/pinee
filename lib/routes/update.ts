import { Client, Message } from "discord.js";
import PinMessageUpdateResponder from "../responder/PinMessageUpdateResponder";
import { isArchived, isByThisBot, isFromDm, isPinned } from "../utils/message";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isByThisBot(client, after)) {
    return;
  }

  if (isFromDm(after)) {
    return;
  }

  if (isPinned(after) || await isArchived(client, after)) {
    await new PinMessageUpdateResponder(after).handle();
  }
}
