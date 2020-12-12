import { Client, Message } from "discord.js";
import CommandResponder from "../responder/CommandResponder";
import { isByThisBot, isFromDm, isNotCommand } from "../utils/message";

export async function onMessage(client: Client, message: Message) {
  if (isFromDm(message)) {
    return;
  }

  if (isByThisBot(client, message)) {
    return;
  }

  if (isNotCommand(message)) {
    return;
  }

  await new CommandResponder(client, message).handle();
}
