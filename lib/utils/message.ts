import { Client, DMChannel, Message, MessageEmbed, MessageReaction, PartialMessage } from "discord.js";
import { isNonPublicChannel } from "./channel";
import config from "../../config";
import { isOwner } from "./user";

export function isSame(one: Message, another: Message) {
  return JSON.stringify(one.toJSON()) === JSON.stringify(another.toJSON());
}

export function isByOwner(message: Message) {
  return isOwner(message.author, message.guild!!);
}

export function isFromDm(message: Message | PartialMessage) {
  return !message.guild;
}

export function isByThisBot(client: Client, message: Message) {
  return message.author.id === client.user?.id;
}

export function isMentioningThisBot(client: Client, message: Message) {
  const mentionedUsers = message.mentions.users.array();

  for (const user of mentionedUsers) {
    if (user.id === client.user?.id) {
      return true;
    }
  }

  return false;
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

export function contentNotChanged(before: Message, after: Message) {
  return !contentChanged(before, after);
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

export function inPlaceSortDateAscending(messages: Message[]) {
  return messages.sort((left: Message, right: Message) => left.createdTimestamp - right.createdTimestamp);
}

export async function messagesFetched(...messages: (Message | PartialMessage)[]): Promise<Message[]> {
  return Promise.all(messages.map(m => m.partial ? m.fetch() : m));
}

export async function reactionsFetched(...reactions: (MessageReaction)[]): Promise<MessageReaction[]> {
  return Promise.all(reactions.map(r => r.partial ? r.fetch() : r));
}

export function extractEmbed(message: Message): MessageEmbed | undefined {
  const noEmbeds = message.embeds.length === 0;
  if (noEmbeds) {
    return undefined;
  }

  return message.embeds[0];
}
