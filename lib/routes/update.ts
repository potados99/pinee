import { Client, Message } from "discord.js";
import NewPinEventResponder from "../responder/NewPinEventResponder";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isByThisBot(client, after)) {
    // Do not echo messages from this bot.
    return;
  }

  if (contentChanged(before, after)) {
    // Not a pin event.
    return
  }

  if (isNotPinned(after)) {
    // Not pinned.
    return;
  }

  // Now this is a new pin event. Handle it.
  await new NewPinEventResponder(client, after).handle();
}

function isByThisBot(client: Client, message: Message) {
  return message.author.id === client.user?.id;
}

function contentChanged(before: Message, after: Message) {
  return before.content !== after.content;
}

function isNotPinned(message: Message) {
  return !message.pinned;
}

