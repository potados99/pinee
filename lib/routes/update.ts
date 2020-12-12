import { Client, Message } from "discord.js";
import NewPinEventResponder from "../responder/NewPinEventResponder";
import {
  contentChanged,
  isArchived,
  isByThisBot,
  isFromDm,
  isJustPinned,
  isNotPinned,
  isPinned
} from "../utils/message";
import PinMessageUpdateResponder from "../responder/PinMessageUpdateResponder";

export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isFromDm(after)) {
    // DM not allowed.
    return;
  }

  if (isByThisBot(client, after)) {
    // Do not echo messages from this bot.
    return;
  }

  console.log(`content changed: ${contentChanged(before, after)}, pinned or archived: ${isPinned(after) || await isArchived(client, after)}`);

  if (!contentChanged(before, after) && isJustPinned(before, after)) {
    // No content change && just pinned -> new pin event
    console.log(`New pin event on message '${after.id}'!`);

    await new NewPinEventResponder(client, after).handle();
  }
  else if (contentChanged(before, after) && (isPinned(after) || await isArchived(client, after))) {
    // Content is changed && pinned-or-archived -> pin or archive update event
    console.log(`Update event on pinned-or-archived-message '${after.id}'!`);

    await new PinMessageUpdateResponder(client, after).handle();
  }
}
