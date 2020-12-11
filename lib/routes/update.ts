import { Client, Message } from "discord.js";
import NewPinEventResponder from "../responder/NewPinEventResponder";
import { contentChanged, isByThisBot, isFromDm, isJustPinned, isNotPinned } from "../utils/message";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isFromDm(after)) {
    // DM not allowed.
    return;
  }

  if (isByThisBot(client, after)) {
    // Do not echo messages from this bot.
    return;
  }

  if (contentChanged(before, after)) {
    // Not a pin event.
    return
  }

  if (!isJustPinned(before, after)) {
    // Not just pinned.
    return;
  }

  // Now this is a new pin event. Handle it.
  await new NewPinEventResponder(client, after).handle();
}
