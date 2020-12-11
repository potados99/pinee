import { Client, Guild, Message } from "discord.js";

export default class Migrate {

  private readonly client: Client;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.guild = message.guild!!;
  }

}
