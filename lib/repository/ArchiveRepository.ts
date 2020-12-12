import channelRepo from "./ChannelRepository";
import { Client, Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import { composeArchiveEmbed, isByThisBot } from "../utils/message";
import messageRepo from "./MessageRepository";

class ArchiveRepository {

  async archiveMessage(message: Message) {
    const archiveChannel = channelRepo.getArchiveChannel(message.guild!!);

    if (!archiveChannel) {
      return null;
    }

    return await this.archiveMessageToChannel(message, archiveChannel);
  }

  async archiveMessageToChannel(message: Message, channel: TextChannel) {
    const embed = composeArchiveEmbed(message.guild!!, message);

    return await channel.send(embed);
  }

  async getAllArchives(client: Client, guild: Guild) {
    const archiveChannel = channelRepo.getArchiveChannel(guild);

    if (!archiveChannel) {
      return [];
    }

    const allMessagesInArchiveChannel = await messageRepo.getAllMessagesOfChannel(archiveChannel);

    const allArchives: Message[] = allMessagesInArchiveChannel.filter((message) => ArchiveRepository.isArchive(client, message));

    return allArchives;
  }

  async getAllArchivedMessageIds(client: Client, guild: Guild) {
    const allArchives = await this.getAllArchives(client, guild);

    return allArchives
      .map((arc) => ArchiveRepository.extractEmbed(arc))
      .filter((emb) => emb)
      // @ts-ignore
      .map((emb: MessageEmbed) => ArchiveRepository.extractChannelAndMessageId(emb.author.url)?.messageId);
  }

  private static isArchive(client: Client, message: Message) {
    if (!isByThisBot(client, message)) {
      return false;
    }

    const embed = ArchiveRepository.extractEmbed(message);
    if (!embed) {
      return false;
    }

    const originalMessageUrl = embed.author?.url;
    if (!originalMessageUrl) {
      return false;
    }

    return !!ArchiveRepository.extractChannelAndMessageId(originalMessageUrl);
  }

  private static extractEmbed(message: Message) {
    const noEmbeds = message.embeds.length === 0;
    if (noEmbeds) {
      return null;
    }

    const embed = message.embeds[0];
    if (!embed) {
      return null;
    }

    return embed;
  }

  private static extractChannelAndMessageId(url: string|null) {
    if (!url) {
      return null;
    }

    const regex = new RegExp(/^https:\/\/discordapp.com\/channels\/([0-9]*)\/(?<CHANNEL_ID>[0-9]*)\/(?<MESSAGE_ID>[0-9]*)\/?$/);

    const hasValidForm = regex.test(url);
    if (!hasValidForm) {
      return null;
    }

    const parts = regex.exec(url);
    const channelId = parts?.groups?.CHANNEL_ID;
    const messageId = parts?.groups?.MESSAGE_ID;

    if (!channelId || !messageId) {
      return null;
    }

    return {
      channelId, messageId
    };
  }
}

const archiveRepo = new ArchiveRepository();

export default archiveRepo;
