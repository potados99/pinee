import Discord, { DMChannel, Guild, Message } from "discord.js";
import { extractEmbed } from "./message";
import config from "../../config";
import MessageRef from "../entities/MessageRef";
import ArchiveService from "../service/ArchiveService";
import ChannelRepository from "../repository/ChannelRepository";

export function composeArchiveEmbed(guild: Guild, message: Message) {
  const name = message.author.username;
  const avatarUrl = message.author.avatarURL();
  const pinContent = message.content;
  const contentDate = message.createdAt.getTime();

  const guildId = guild.id;
  const channelId = message.channel.id;
  const messageId = message.id;
  const firstImageUrl = message.attachments.first()?.url;

  // User can explicitly click this link.
  const messageUrl = `https://discordapp.com/channels/${guildId}/${channelId}/${messageId}`;
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

export function extractOriginalMessageRef(archive: Message): MessageRef | undefined {
  const embed = extractEmbed(archive);
  if (embed == null) {
    return undefined;
  }

  const author = embed.author;
  if (author == null) {
    return undefined;
  }

  const url = author.url;
  if (url == null) {
    return undefined;
  }

  const regex = new RegExp(/^https:\/\/discordapp.com\/channels\/(?<GUILD_ID>[0-9]*)\/(?<CHANNEL_ID>[0-9]*)\/(?<MESSAGE_ID>[0-9]*)\/?$/);

  const hasValidForm = regex.test(url);
  if (!hasValidForm) {
    return undefined;
  }

  const parts = regex.exec(url);
  const guildId = parts?.groups?.GUILD_ID;
  const channelId = parts?.groups?.CHANNEL_ID;
  const messageId = parts?.groups?.MESSAGE_ID;

  if (guildId == null || channelId == null || messageId == null) {
    return undefined;
  }

  return new MessageRef(guildId, channelId, messageId);
}

export async function isArchived(message: Message): Promise<Boolean> {
  const archiveChannel = await ChannelRepository.getArchiveChannel(message.guild!!);
  if (archiveChannel == null) {
    return false;
  }

  const archive = await new ArchiveService(archiveChannel).getArchive(message);

  return archive != null;
}
