import {Channel, DMChannel, NewsChannel, TextChannel} from 'discord.js';

export function isMessageChannel(channel: Channel) {
  return (
    (channel.type === 'text' && channel instanceof TextChannel) ||
    (channel.type === 'news' && channel instanceof NewsChannel) ||
    (channel.type === 'dm' && channel instanceof DMChannel)
  );
}

export function isTextChannel(channel: Channel) {
  return (
    (channel.type === 'text' && channel instanceof TextChannel) ||
    (channel.type === 'news' && channel instanceof NewsChannel)
  );
}

export function getChannelName(channel: Channel) {
  if (channel instanceof DMChannel) {
    return channel.recipient.username;
  } else if (channel instanceof TextChannel) {
    return channel.name;
  } else if (channel instanceof NewsChannel) {
    return channel.name;
  }
}
