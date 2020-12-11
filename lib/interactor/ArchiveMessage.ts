import { Client, Guild, Message, TextChannel } from "discord.js";
import { composeArchiveEmbed } from "../utils/message";

export default class ArchiveMessage {

  private readonly client: Client;
  private readonly message: Message;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!;
  }

  public async execute(archiveChannel: TextChannel) {
    const embed = composeArchiveEmbed(this.guild, this.message);
    await archiveChannel.send(embed);

    console.log(`${this.message.id} Archived!`);
  }
}
