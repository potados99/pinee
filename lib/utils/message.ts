import Discord, {
  Channel,
  Client,
  DMChannel,
  Guild,
  Message, MessageEmbed,
  NewsChannel,
  PartialMessage,
  PermissionOverwrites,
  TextChannel
} from "discord.js";
import { isNonPublicChannel } from "./channel";
import config from "../../config";
import ArchiveRepository from "../repository/ArchiveRepository";

export function isByOwner(message: Message) {
  return message.author.id === message.guild!!.ownerID;
}

export function isFromDm(message: Message | PartialMessage) {
  return !message.guild;
}

export function isByThisBot(client: Client, message: Message) {
  return message.author.id === client.user?.id;
}

export function contentChanged(before: Message, after: Message) {
  return before.content !== after.content;
}

export function isNotPinned(message: Message) {
  return !message.pinned;
}

export function isJustPinned(before: Message, after: Message) {
  return !before.pinned && after.pinned;
}

export function isFromNonPublicChannel(message: Message) {
  const channel = message.channel;

  return isNonPublicChannel(channel);
}

export function isFromNsfwChannel(message: Message) {
  const channel = message.channel;

  if (channel instanceof DMChannel) {
    // No property 'nsfw' in DM channel.
    return false;
  }

  return channel.nsfw;
}

export function composeArchiveEmbed(guild: Guild, message: Message) {
  const name = message.author.username;
  const avatarUrl = message.author.avatarURL();
  const pinContent = message.content;
  const contentDate = message.createdAt.getTime();

  const server = guild.id;
  const channelId = message.channel.id;
  const messageId = message.id;
  const firstImageUrl = message.attachments.first()?.url;

  // User can explicitly click this link.
  const jumpToMessageLink = `\n\n[${config.string.jumpToMessage}](https://discordapp.com/channels/${server}/${channelId}/${messageId})`;

  let channelName; // No channel name on DMChannel.
  if (!(message.channel instanceof DMChannel)) {
    channelName = message.channel.name;
  }

  return new Discord.MessageEmbed({
    description: pinContent + jumpToMessageLink,
    color: config.bot.themeColor,
    timestamp: contentDate,
    author: {
      name: name,
      iconURL: avatarUrl || undefined,
      url: `https://discordapp.com/channels/${server}/${channelId}/${messageId}`
    },
    image: {
      url: firstImageUrl
    },
    footer: {
      text: `${channelName}`
    }
  });
}

export function attachMessageLinkToEmbed(embed: MessageEmbed, serverId: string, channelId: string, messageId: string) {
  const jumpToMessageLink = `\n\n[${config.string.jumpToMessage}](https://discordapp.com/channels/${serverId}/${channelId}/${messageId})`;

  embed.description += jumpToMessageLink;
}

export function inPlaceSortDateAscending(messages: Message[]) {
  return messages.sort((left: Message, right: Message) => left.createdTimestamp - right.createdTimestamp);
}
