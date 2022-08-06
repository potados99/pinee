import config from '../../config';
import {Message} from 'discord.js';
import AskUserBoolean from './AskUserBoolean';
import ChannelRepository from '../repository/ChannelRepository';

export default class GetOrCreateArchiveChannel {
  constructor(private readonly message: Message) {}

  public async execute() {
    return await this.findOrCreateArchiveChannel();
  }

  private async findOrCreateArchiveChannel() {
    const channelFound = ChannelRepository.getArchiveChannel(this.message.guild!!);

    return channelFound || (await this.createArchiveChannel());
  }

  private async createArchiveChannel() {
    let newChannelName = config.behaviors.archiving.channel.newArchiveChannelName;

    const create = await new AskUserBoolean(this.message).execute({
      title: '아카이브 채널을 만들까요?',
      description: `토픽에 '${config.behaviors.archiving.channel.topicKeyword}'이(가) 들어간 채널이 아직 없습니다. '${newChannelName}'(이)라는 이름으로 새 채널을 생성할까요?`,
      color: config.services.discord.bot.themeColor,
    });

    if (!create) {
      return null;
    }

    return await this.message.guild!!.channels.create(
      config.behaviors.archiving.channel.newArchiveChannelName,
      {
        type: 'text',
        topic: config.behaviors.archiving.channel.topicKeyword,
      }
    );
  }
}
