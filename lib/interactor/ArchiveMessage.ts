import Discord, { Client, DMChannel, Guild, Message, TextChannel } from "discord.js";
import config from "../../config";

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
    const name = this.message.author.username;
    const avatarUrl = this.message.author.avatarURL();
    const pinContent = this.message.content;
    const contentDate = this.message.createdAt.getTime();

    const server = this.guild.id;
    const channelId = this.message.channel.id;
    const messageId = this.message.id;
    const firstImageUrl = this.message.attachments.first()?.url;

    let channelName; // No channel name on DMChannel.
    if (!(this.message.channel instanceof DMChannel)) {
      channelName = this.message.channel.name;
    }

    const embed = new Discord.MessageEmbed({
      description: pinContent,
      color: config.bot.themeColor,
      timestamp: contentDate,
      author: {
        name: name,
        iconURL: avatarUrl || undefined,
        url: `https://discordapp.com/channels/${server}/${channelId}/${messageId}`
      },
      image: {
        url: firstImageUrl
      },
      footer: {
        text: `${channelName}`,
      },
    });

    await archiveChannel.send(embed);

    console.log(`${this.message.id} Archived!`);
  }
}
