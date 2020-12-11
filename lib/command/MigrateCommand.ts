import Command from "./Command";
import { Client, Message, MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import AskUser from "../interactor/AskUser";
import config from "../../config";
import GetArchiveChannel from "../interactor/GetArchiveChannel";
import { composeArchiveEmbed, isByOwner, isByThisBot } from "../utils/message";

export default class MigrateCommand extends Command {
  constructor(command: string) {
    super(command);
  }

  public async execute(client: Client, message: Message): Promise<void> {
    if (!isByOwner(message)) {
      return;
    }

    const keep = await new AskUser(client, message).execute({
      title: '고정메시지 마이그레이션',
      description: `백업된 고정메시지들에 원본으로 이동하는 링크를 추가합니다. 이미 링크가 추가된 메시지는 건너뜁니다. 백업된 메시지가 가리키는 원본 메시지에는 영향이 없습니다.\n계속 하시겠습니까?\n**주의: 원본 메시지의 최신 버전을 가져오기 때문에 원본이 변경된 경우 백업 또한 변경됩니다. 삭제된 메시지에는 링크가 달리지 않습니다.**`,
      color: config.bot.themeColor
    });

    if (!keep) {
      return;
    }

    await this.performMigration(client, message);
  }

  private async performMigration(client: Client, message: Message) {
    const archiveChannel = await new GetArchiveChannel(client, message).execute();
    if (!archiveChannel) {
      console.log('No archive channel! :(');
      await message.reply('아카이브 채널이 아직 없네요ㅠ 마이그레이션을 중단합니다.')
      return;
    }

    const allMessagesInArchiveChannel = await archiveChannel.messages.fetch();
    const messagesByThisBot = allMessagesInArchiveChannel.array().filter((message) => isByThisBot(client, message));
    const archivesToMigrate = messagesByThisBot.filter((message) => this.isThisAPinArchive(message));

    const progressMessage = await message.reply(`마이그레이션 중... 0/${archivesToMigrate.length}`);

    for (let i = 0; i < archivesToMigrate.length; i++) {
      const embedMessage = archivesToMigrate[i];
      const embed = this.extractEmbed(embedMessage);

      await progressMessage.edit(`마이그레이션 중... ${i+1}/${archivesToMigrate.length}`);

      const originalMessage = await this.getOriginalMessage(client, embed);
      if (!originalMessage) {
        console.warn(`Missing original message '${embed?.author?.url}'`);
        continue;
      }

      await embedMessage.edit(composeArchiveEmbed(message.guild!!, originalMessage));
    }

    await progressMessage.edit(`'${archiveChannel.name}'에서 ${archivesToMigrate.length}개의 고정 메시지를 업데이트하였습니다.`);
  }

  private extractEmbed(message: Message) {
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

  private isThisAPinArchive(message: Message) {
    const embed = this.extractEmbed(message);
    if (!embed) {
      return;
    }

    const messageHasJumpLink = embed.description?.includes(`[${config.string.jumpToMessage}]`);
    if (messageHasJumpLink) {
      return false;
    }

    const originalMessageUrl = embed.author?.url;
    if (!originalMessageUrl) {
      return false;
    }

    const channelAndMessageIds = this.extractChannelAndMessageId(originalMessageUrl);
    if (!channelAndMessageIds) {
      return false;
    }

    return true;
  }

  private extractChannelAndMessageId(url: string|null) {
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

  private async getOriginalMessage(client: Client, embed: MessageEmbed|null) {
    if (!embed) {
      return null;
    }

    const channelAndMessageIds = this.extractChannelAndMessageId(embed.author?.url || null);
    if (!channelAndMessageIds) {
      return null;
    }

    const { channelId, messageId } = channelAndMessageIds;

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return null;
    }
    if (channel.type !== 'text' && channel.type !== 'news') {
      return null;
    }

    if (channel instanceof TextChannel || channel instanceof NewsChannel) {
      try {
        return await channel.messages.fetch(messageId);
      } catch (e) {
        console.error(`No such message as '${messageId}'!`);
        return null;
      }
    } else {
      return null;
    }
  }
}
