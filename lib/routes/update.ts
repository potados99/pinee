import { Client, Message } from "discord.js";
import NewPinEventResponder from "../responder/NewPinEventResponder";
import {
  contentChanged,
  isArchived,
  isByThisBot,
  isFromDm,
  isJustPinned,
  isPinned
} from "../utils/message";
import PinMessageUpdateResponder from "../responder/PinMessageUpdateResponder";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isByThisBot(client, after)) {
    return;
  }

  if (isFromDm(after)) {
    return;
  }

  if (!contentChanged(before, after) && isJustPinned(before, after)) {
    console.log(`New pin event on message '${after.id}'`);

    await new NewPinEventResponder(client, after).handle();
    return;
  }

  if (contentChanged(before, after) && (isPinned(after) || await isArchived(client, after))) {
    console.log(`Update event on pinned-or-archived-message '${after.id}'`);

    await new PinMessageUpdateResponder(client, after).handle();
    return;
  }
}
