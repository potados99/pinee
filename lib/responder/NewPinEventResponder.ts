import Discord, { Client, DMChannel, Guild, Message, PermissionOverwrites, TextChannel } from "discord.js";
import config from "../../config";
import AskUser from "../interactor/AskUser";

export default class NewPinEventResponder {

  private client: Client;
  private message: Message;
  private guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!; /* Cannot be null */
  }

  public async handle() {
    // Ask if this message is from private channel.
    if (this.isMessageFromNonPublicChannel() && !await this.askIfUserWantsToPublishThis()) {
      return;
    }

    // Perform archive
    await this.archiveMessage();
  }

  isMessageFromNonPublicChannel() {
    // @ts-ignore
    const channelPermissionsOverwrites: Map<string, PermissionOverwrites> = this.message.channel.permissionOverwrites;

    for (const overwrite of channelPermissionsOverwrites.values()) {
      const isAboutRole = overwrite.type === "role";
      const isAboutMember = overwrite.type === "member";
      const readDenied = overwrite.deny.bitfield & 1024;

      if (isAboutRole && readDenied) {
        console.log("This is a non-public channel for >= 1 role(s).");
        return true;
      }

      if (isAboutMember && readDenied) {
        console.log("This is a non-public channel for >= 1 member(s).");
        return true;
      }
    }

    return false;
  }

  async askIfUserWantsToPublishThis() {
    return new AskUser(this.client, this.message).execute({
      title: "오이오이 위험하다구!",
      description: "이 메시지를 고정하면 모든 사용자가 볼 수 있습니다. 계속할까요?",
      color: config.bot.themeColor
    });
  }

  async archiveMessage() {
    console.log("Archive it!");

    const archiveChannel = await this.findOrCreateArchiveChannel();
    if (!archiveChannel) {
      console.log("No archiveChannel!!");
      return;
    }

    const name = this.message.author.username;
    const avatarUrl = this.message.author.avatarURL();
    const pinContent = this.message.content;

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

    console.log("Archived!");
  }

  async findOrCreateArchiveChannel() {
    const allChannels = this.guild.channels.cache.array();

    // Find channel of which topic has archive keyword.
    const channelFound = allChannels.find((channel) => {
      // @ts-ignore
      return !!channel.topic && channel.type == "text" && channel.topic.includes(config.archiveChannel.topicKeyword);
    });

    // Or create new one.
    return channelFound as TextChannel || await this.createArchiveChannel();
  }

  async createArchiveChannel() {
    let newChannelName = config.archiveChannel.channelName;
    if (await this.checkIfChannelWithNameExists(newChannelName)) {
      newChannelName += "_이이름은아무도안쓰겠지"; // not gonna duplicate again.
    }

    const create = await new AskUser(this.client, this.message).execute(
      {
        title: "아카이브 채널을 만들까요?",
        description: `토픽에 '${config.archiveChannel.topicKeyword}'이(가) 들어간 채널이 아직 없습니다. '${newChannelName}'(이)라는 이름으로 새 채널을 생성할까요?`,
        color: config.bot.themeColor
      }
    );

    if (!create) {
      return null;
    }

    return await this.guild.channels.create(config.archiveChannel.channelName, {
      type: "text",
      topic: config.archiveChannel.topicKeyword
    });
  }

  async checkIfChannelWithNameExists(name: string) {
    const allChannels = this.guild.channels.cache.array();

    // Find channel by name.
    const channelFound = allChannels.find((channel) => {
      // @ts-ignore
      return channel.name === name;
    });

    return !!channelFound;
  }
}
