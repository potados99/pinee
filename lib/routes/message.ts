import { Client, Message } from "discord.js";
import CommandResponder from "../responder/CommandResponder";
import { isByThisBot, isCommand, isFromDm } from "../utils/message";
import DmResponder from "../responder/DmResponder";

export async function onMessage(client: Client, message: Message) {
  if (isByThisBot(client, message)) {
    return;
  }

  if (isFromDm(message)) {
    console.log(`New DM event: '${message.content}'`);

    await new DmResponder(client, message).handle();
    return;
  }

  if (isCommand(message)) {
    console.log(`New command event: '${message.content}'`);

    await new CommandResponder(client, message).handle();
    return;
  }
}
