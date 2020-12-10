import config from "../../config";
import { Client, Guild, Message, TextChannel } from "discord.js";
import AskUser from "./AskUser";

export default class GetArchiveChannel {

  private readonly client: Client;
  private readonly message: Message;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!; /* Cannot be null */
  }

  public async execute() {
    return await this.findOrCreateArchiveChannel();
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
