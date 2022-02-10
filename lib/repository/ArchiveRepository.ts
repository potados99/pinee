import channelRepo from "./ChannelRepository";
import { Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import { composeArchiveEmbed, isByThisBot } from "../utils/message";
import messageRepo from "./MessageRepository";

class ArchiveRepository {

  async createArchive(message: Message) {
    const archiveChannel = channelRepo.getArchiveChannel(message.guild!!);
    if (archiveChannel == null) {
      console.log(`But no archive channel exists!`);
      return null;
    }

    return await this.createArchiveToChannel(message, archiveChannel);
  }

  async createArchiveToChannel(message: Message, channel: TextChannel) {
    // const archive = await this.getArchive(message);
    // if (archive != null) {
    //   console.log(`But message '${message.id}' is already archived!`);
    //   return;
    // }

    const embed = composeArchiveEmbed(message.guild!!, message);
    const newlyArchived = await channel.send(embed);

    console.log(`New archive '${newlyArchived.id}' of message '${message.id}' created in '${channel.name}' channel.`);

    return newlyArchived;
  }

  async getArchive(message: Message) {
    const allArchives = await this.getAllArchives(message.guild!!);

    return allArchives
      .find((arc: Message) => ArchiveRepository.extractChannelAndMessageId(ArchiveRepository.extractEmbed(arc)?.author?.url || null)?.messageId === message.id);
  }

  async getAllArchives(guild: Guild, progress?: Message) {
    const archiveChannel = channelRepo.getArchiveChannel(guild);

    return this.getAllArchivesFromChannel(archiveChannel, progress);
  }

  async getAllArchivesFromChannel(archiveChannel?: TextChannel, progress?: Message) {
    if (!archiveChannel) {
      return [];
    }

    const allMessagesInArchiveChannel = await messageRepo.getAllMessagesFromChannel(archiveChannel, progress);

    const allArchives: Message[] = allMessagesInArchiveChannel.filter((message) => ArchiveRepository.isArchive(message));

    return allArchives;
  }

  async getAllArchivedMessageIds(guild: Guild) {
    const allArchives = await this.getAllArchives(guild);

    return allArchives
      .map((arc) => ArchiveRepository.extractEmbed(arc))
      .filter((emb) => emb)
      // @ts-ignore
      .map((emb: MessageEmbed) => ArchiveRepository.extractChannelAndMessageId(emb.author.url)?.messageId);
  }

  async updateArchive(archive: Message, message: Message) {
    await archive.edit(composeArchiveEmbed(message.guild!!, message));
  }

  async deleteArchive(archive: Message) {
    await archive.delete();

    console.log(`Archive ${archive.id} deleted.`);
  }

  private static isArchive(message: Message) {
    if (!isByThisBot(message.client, message)) {
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
