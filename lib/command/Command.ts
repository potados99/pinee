import { Client, Message } from "discord.js";

export default class Command {

  protected name: string;

  constructor(command: string) {
    this.name = command;
  }

  async execute(client: Client, message: Message) {
    throw new Error('Not implemented!');
  }
}
