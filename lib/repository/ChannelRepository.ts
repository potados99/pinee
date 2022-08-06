import {isTextChannel} from '../utils/channel';
import {ChannelType, Guild, TextChannel} from 'discord.js';

/**
 * 채널 정보를 제공하는 저장소입니다.
 */
class ChannelRepository {
  /**
   * 길드 내에서 topic으로 텍스트 채널을 찾습니다.
   * @param guild 채널을 찾을 길드
   * @param topic 채널의 topic에 이 문자열이 포함되면 해당 채널을 가져옵니다.
   */
  findTextChannelByTopic(guild: Guild, topic: string): TextChannel | undefined {
    return this.findTextChannel(guild, (channel) => !!channel.topic && channel.topic.includes(topic));
  }

  /**
   * 길드 내에서 predicate을 사용해 텍스트 채널을 찾습니다.
   * @param guild 채널을 찾을 길드
   * @param predicate 채널에 적용할 predicate
   */
  findTextChannel(guild: Guild, predicate: (channel: TextChannel) => boolean): TextChannel | undefined {
    const allChannels = guild.channels.cache;

    return allChannels.find((channel) => isTextChannel(channel) && predicate(channel as TextChannel)) as TextChannel;
  }

  /**
   * 길드에 새 텍스트 채널을 생성합니다.
   * @param guild 채널을 만들 길드
   * @param name 채널 이름
   * @param topic 채널 토픽
   */
  createTextChannel(guild: Guild, name: string, topic: string): Promise<TextChannel> {
    return guild.channels.create({
      name: name,
      type: ChannelType.GuildText,
      topic: topic,
    });
  }
}

export default new ChannelRepository();
