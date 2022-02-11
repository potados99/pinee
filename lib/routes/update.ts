import { Client, Message } from "discord.js";
import PinMessageUpdateResponder from "../responder/PinMessageUpdateResponder";
import { isByThisBot, isFromDm, isPinned } from "../utils/message";
import { isArchived } from "../utils/archive";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isByThisBot(client, after)) {
    return;
  }

  if (isFromDm(after)) {
    return;
  }

  if (isPinned(after) || await isArchived(after)) {
    await new PinMessageUpdateResponder(after).handle();
  }
}
