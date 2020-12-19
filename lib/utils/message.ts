import Discord, { Client, DMChannel, Guild, Message, PartialMessage } from "discord.js";
import { isNonPublicChannel } from "./channel";
import config from "../../config";
import archiveRepo from "../repository/ArchiveRepository";

export function isByOwner(message: Message) {
  return true // message.author.id === message.guild!!.ownerID;
}

export function isFromDm(message: Message | PartialMessage) {
  return !message.guild;
}

export function isByThisBot(client: Client, message: Message) {
  return message.author.id === client.user?.id;
}

export function isCommand(message: Message) {
  return message.content.startsWith(config.command.prefix);
}

export function isNotCommand(message: Message) {
  return !isCommand(message);
}

export function contentChanged(before: Message, after: Message) {
  return before.content !== after.content;
}

export function isPinned(message: Message) {
  return message.pinned;
}

export function isNotPinned(message: Message) {
  return !isPinned(message);
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
  const messageUrl = `https://discordapp.com/channels/${server}/${channelId}/${messageId}`;
  const jumpToMessageLink = `\n\n[${config.string.jumpToMessage}](${messageUrl})`;

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
      url: messageUrl
    },
    image: {
      url: firstImageUrl
    },
    footer: {
      text: channelName
    }
  });
}

export function inPlaceSortDateAscending(messages: Message[]) {
  return messages.sort((left: Message, right: Message) => left.createdTimestamp - right.createdTimestamp);
}

export async function isArchived(client: Client, message: Message) {
  const allArchivedIds = await archiveRepo.getAllArchivedMessageIds(client, message.guild!!);

  return allArchivedIds.includes(message.id);
}
