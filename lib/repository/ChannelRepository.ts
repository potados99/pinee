import {DMChannel, Guild, GuildChannel, NewsChannel, TextChannel} from 'discord.js';
import {isMessageChannel, isTextChannel} from '../utils/channel';
import config from '../../config';

/**
 * Prefix rule:
 *  Search with predicate   ? find : get
 *  Returns list            ? all : .
 */
class ChannelRepository {
  findAllChannelsOfGuild(
    guild: Guild,
    predicate: (channel: GuildChannel) => boolean
  ): GuildChannel[] {
    const allChannels = guild.channels.cache.array();

    return allChannels.filter((channel) => predicate(channel));
  }

  findTextChannelOfGuild(
    guild: Guild,
    predicate: (channel: TextChannel) => boolean
  ): TextChannel | undefined {
    const allChannels = guild.channels.cache.array();

    return allChannels.find(
      (channel) => isTextChannel(channel) && predicate(channel as TextChannel)
    ) as TextChannel;
  }

  getTextChannelOfGuildWithTopic(guild: Guild, topic: string): TextChannel | undefined {
    return this.findTextChannelOfGuild(
      guild,
      (channel) => !!channel.topic && channel.topic.includes(topic)
    );
  }

  getArchiveChannel(guild: Guild): TextChannel | undefined {
    return this.getTextChannelOfGuildWithTopic(
      guild,
      config.behaviors.archiving.channel.topicKeyword
    );
  }

  findAllMessageChannelsOfGuild(
    guild: Guild,
    predicate: (channel: TextChannel | NewsChannel | DMChannel) => boolean = () => true
  ): (TextChannel | NewsChannel | DMChannel)[] {
    const allChannels = guild.channels.cache.array();

    // @ts-ignore
    return allChannels.filter((channel) => isMessageChannel(channel) && predicate(channel));
  }

  findAllTextChannelsOfGuild(
    guild: Guild,
    predicate: (channel: TextChannel | NewsChannel) => boolean = () => true
  ): (TextChannel | NewsChannel)[] {
    const allChannels = guild.channels.cache.array();

    // @ts-ignore
    return allChannels.filter((channel) => isTextChannel(channel) && predicate(channel));
  }
}

export default new ChannelRepository();
