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
    const archive = await this.getArchiveByMessageId(message.client, message.guild!!, message.id);
    if (archive) {
      console.log(`But message '${message.id}' is already archived!`);
      return;
    }

    const embed = composeArchiveEmbed(message.guild!!, message);

    const newlyArchived = await channel.send(embed);

    console.log(`Archive '${newlyArchived.id}' for message '${message.id}' created in '${channel.name}' channel.`);

    return newlyArchived;
  }

  async getAllArchives(client: Client, guild: Guild) {
    const archiveChannel = channelRepo.getArchiveChannel(guild);

    return this.getAllArchivesFromChannel(client, archiveChannel);
  }

  async getAllArchivesFromChannel(client: Client, archiveChannel?: TextChannel) {
    if (!archiveChannel) {
      return [];
    }

    const allMessagesInArchiveChannel = await messageRepo.getAllMessagesOfChannel(archiveChannel);

    const allArchives: Message[] = allMessagesInArchiveChannel.filter((message) => ArchiveRepository.isArchive(client, message));

    console.log(`Got ${allArchives.length} archives.`);

    return allArchives;
  }

  async getArchiveByMessageId(client: Client, guild: Guild, messageId: string) {
    const allArchives = await this.getAllArchives(client, guild);

    return allArchives
      .find((arc: Message) => ArchiveRepository.extractChannelAndMessageId(ArchiveRepository.extractEmbed(arc)?.author?.url || null)?.messageId === messageId);
  }

  async getAllArchivedMessageIds(client: Client, guild: Guild) {
    const allArchives = await this.getAllArchives(client, guild);

    return allArchives
      .map((arc) => ArchiveRepository.extractEmbed(arc))
      .filter((emb) => emb)
      // @ts-ignore
      .map((emb: MessageEmbed) => ArchiveRepository.extractChannelAndMessageId(emb.author.url)?.messageId);
  }

  async updateArchive(client: Client, message: Message) {
    const archive = await this.getArchiveByMessageId(client, message.guild!!, message.id);

    if (!archive) {
      console.log(`Message '${message.id}' is not archived, so that cannot be updated!`);
      return;
    }

    await archive.edit(composeArchiveEmbed(message.guild!!, message));
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

  private static extractChannelAndMessageId(url: string | null) {
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
