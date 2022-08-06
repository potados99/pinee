import config from '../../config';
import {info, warn} from '../utils/logging';
import AskUserBoolean from '../interactor/AskUserBoolean';
import ChannelRepository from '../repository/ChannelRepository';
import {Guild, Message, TextChannel} from 'discord.js';

export default class ChannelService {
  /**
   * 아카이브 채널을 가져옵니다. 없으면 undefined 입니다.
   * @param guild 채널이 속한 길드
   */
  findArchiveChannel(guild: Guild): TextChannel | undefined {
    return ChannelRepository.findTextChannelByTopic(
      guild,
      config.behaviors.archiving.channel.topicKeyword
    );
  }

  /**
   * 아카이브 채널을 가져오거나, 없으면 사용자에게 물어 새로 생성합니다.
   * @param message 사용자에게 물어볼 때에 사용할 메시지
   */
  async getOrCreateArchiveChannel(message: Message) {
    const channelFound = this.findArchiveChannel(message.guild!!);

    return channelFound || (await this.createArchiveChannel(message));
  }

  private async createArchiveChannel(message: Message) {
    let newChannelName = config.behaviors.archiving.channel.newArchiveChannelName;

    const create = await new AskUserBoolean(message).execute({
      title: '아카이브 채널을 만들까요?',
      description: `토픽에 '${config.behaviors.archiving.channel.topicKeyword}'이(가) 들어간 채널이 아직 없습니다. '${newChannelName}'(이)라는 이름으로 새 채널을 생성할까요?`,
      color: config.services.discord.bot.themeColor,
    });

    if (!create) {
      warn('아카이브 채널을 만들 지 사용자에게 물어보았으나 거절 답변이 왔습니다.');
      return null;
    }

    info(
      `'${config.behaviors.archiving.channel.newArchiveChannelName}'라는 이름으로 새 아카이브 채널을 생성합니다.`
    );

    return await ChannelRepository.createTextChannel(
      message.guild!!,
      config.behaviors.archiving.channel.newArchiveChannelName,
      config.behaviors.archiving.channel.topicKeyword
    );
  }
}
