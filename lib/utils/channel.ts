import { Channel, DMChannel, NewsChannel, PermissionOverwrites, TextChannel } from "discord.js";

export function isNonPublicChannel(channel: TextChannel | DMChannel | NewsChannel /* Channels with message */) {
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

export function isNsfwChannel(channel: TextChannel | DMChannel | NewsChannel /* Channels with message */) {
  if (channel instanceof DMChannel) {
    // No property 'nsfw' in DM channel.
    return false;
  }

  return channel.nsfw;
}

export function isMessageChannel(channel: Channel) {
  return ((channel.type === "text" && channel instanceof TextChannel) ||
    (channel.type === "news" && channel instanceof NewsChannel)) ||
    (channel.type === "dm" && channel instanceof DMChannel);
}

export function isTextChannel(channel: Channel) {
  return ((channel.type === "text" && channel instanceof TextChannel) ||
    (channel.type === "news" && channel instanceof NewsChannel));
}
