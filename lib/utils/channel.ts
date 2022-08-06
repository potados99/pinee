import {Channel, ChannelType, DMChannel, NewsChannel, TextChannel} from 'discord.js';

export function isMessageChannel(channel: Channel) {
  return (
    channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews || channel.type === ChannelType.DM
  );
}

export function isTextChannel(channel: Channel) {
  return channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews;
}

export function getChannelName(channel: Channel) {
  if (channel instanceof DMChannel) {
    return channel.recipient?.username;
  } else if (channel instanceof TextChannel) {
    return channel.name;
  } else if (channel instanceof NewsChannel) {
    return channel.name;
  }
}
