import config from "../../config";
import { Client, Message } from "discord.js";
import AskUserBoolean from "./AskUserBoolean";
import channelRepo from "../repository/ChannelRepository";

export default class GetOrCreateArchiveChannel {
  constructor(
    private readonly client: Client,
    private readonly message: Message,
    private readonly guild = message.guild!!
  ) {
  }

  public async execute() {
    return await this.findOrCreateArchiveChannel();
  }

  async findOrCreateArchiveChannel() {
    const channelFound = channelRepo.getArchiveChannel(this.guild);

    return channelFound || await this.createArchiveChannel();
  }

  async createArchiveChannel() {
    let newChannelName = config.archiveChannel.channelName;

    const create = await new AskUserBoolean(this.client, this.message).execute(
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
}
