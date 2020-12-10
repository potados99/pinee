import { Client, Message } from "discord.js";
import config from "../../config";

export default class CommandResponder {

  private readonly client: Client;
  private readonly message: Message;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
  }

  public async handle() {
    // Extract command name.
    const commandName = this.message.content.slice(config.command.prefix.length); // Remove command prefix.
    if (!commandName) {
      return;
    }

    const allSupportedCommands = config.command.list;

    // Find command using extracted name.
    const commandFound = allSupportedCommands.find((command) => command.getName() === commandName);
    if (!commandFound) {
      return;
    }

    // Execute it.
    await commandFound.execute(this.client, this.message);
  }
}
