import config from '../../config';
import {isTextChannel} from '../utils/channel';
import {Guild, TextChannel} from 'discord.js';

/**
 * 채널 정보를 제공하는 저장소입니다.
 */
class ChannelRepository {
  /**
   * 길드에서 아카이브 채널을 가져옵니다.
   * @param guild 아카이브 채널이 들어 있는 길드
   */
  getArchiveChannel(guild: Guild): TextChannel | undefined {
    return this.getTextChannelOfGuildWithTopic(
      guild,
      config.behaviors.archiving.channel.topicKeyword
    );
  }

  /**
   * 길드 내에서 topic으로 텍스트 채널을 찾습니다.
   * @param guild 채널을 찾을 길드
   * @param topic 채널의 topic에 이 문자열이 포함되면 해당 채널을 가져옵니다.
   */
  getTextChannelOfGuildWithTopic(guild: Guild, topic: string): TextChannel | undefined {
    return this.findTextChannelOfGuild(
      guild,
      (channel) => !!channel.topic && channel.topic.includes(topic)
    );
  }

  /**
   * 길드 내에서 predicate을 사용해 텍스트 채널을 찾습니다.
   * @param guild 채널을 찾을 길드
   * @param predicate 채널에 적용할 predicate
   */
  findTextChannelOfGuild(
    guild: Guild,
    predicate: (channel: TextChannel) => boolean
  ): TextChannel | undefined {
    const allChannels = guild.channels.cache.array();

    return allChannels.find(
      (channel) => isTextChannel(channel) && predicate(channel as TextChannel)
    ) as TextChannel;
  }
}

export default new ChannelRepository();
