import { Client, Message } from "discord.js";
import config from "../../config";
import CommandResponder from "../responder/CommandResponder";

export async function onMessage(client: Client, message: Message) {
  if (isByThisBot(client, message)) {
    // Do not echo messages from this bot.
    return;
  }

  if (isNotCommand(message)) {
    // Only handle command.
    return;
  }

  await new CommandResponder(client, message).handle();
}

function isByThisBot(client: Client, message: Message) {
  return message.author.id === client.user?.id;
}

function isNotCommand(message: Message) {
  return !message.content.startsWith(config.command.prefix);
}
