import { DMChannel, Guild, GuildChannel, NewsChannel, PermissionOverwrites, TextChannel } from "discord.js";
import config from "../../config";

export function findChannel(guild: Guild, predicate: (channel: GuildChannel) => boolean) {
  const allChannels = guild.channels.cache.array();

  return allChannels.find((channel) => predicate(channel));
}

export function findTextChannel(guild: Guild, predicate: (channel: TextChannel) => boolean): TextChannel {
  const allChannels = guild.channels.cache.array();

  return allChannels.find((channel) =>
    (channel.type === 'text') &&
    (channel instanceof TextChannel) &&
    predicate(channel)) as TextChannel;
}

export function findTextChannelWithTopic(guild: Guild, topic: string): TextChannel {
  return findTextChannel(guild, (channel) =>
    !!channel.topic && channel.topic.includes(topic));
}

export function findAllMessageChannels(guild: Guild, predicate: (channel: TextChannel|NewsChannel) => boolean): [TextChannel|NewsChannel] {
  const allChannels = guild.channels.cache.array();

  // @ts-ignore
  return allChannels.filter((channel) =>
    ((channel.type === 'text' && channel instanceof TextChannel) ||
      (channel.type === 'news' && channel instanceof NewsChannel)) &&
    predicate(channel));
}

export function isNonPublicChannel(channel: TextChannel|DMChannel|NewsChannel /* Channels with message */) {
  // @ts-ignore
  const channelPermissionsOverwrites: Map<string, PermissionOverwrites> = channel.permissionOverwrites;

  for (const overwrite of channelPermissionsOverwrites.values()) {
    const isAboutRole = overwrite.type === "role";
    const isAboutMember = overwrite.type === "member";
    const readDenied = overwrite.deny.bitfield & 1024;

    if ((isAboutRole || isAboutMember) && readDenied) {
      return true;
    }
  }

  return false;
}

export default function isNsfwChannel(channel: TextChannel|DMChannel|NewsChannel /* Channels with message */) {
  if (channel instanceof DMChannel) {
    // No property 'nsfw' in DM channel.
    return false;
  }

  return channel.nsfw;
}
