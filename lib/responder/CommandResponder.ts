import { Client, Message } from "discord.js";
import config from "../../config";
import Responder from "./Responder";
import commands from "../../commands";

export default class CommandResponder implements Responder {

  private readonly client: Client;
  private readonly message: Message;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
  }

  public async handle() {
    const commandName = this.message.content.slice(config.command.prefix.length); // Remove command prefix.
    if (!commandName) {
      return;
    }

    const allSupportedCommands = commands;

    const commandFound = allSupportedCommands.find((command) => command.getName() === commandName);
    if (!commandFound) {
      return;
    }

    await commandFound.execute(this.client, this.message);
  }
}
