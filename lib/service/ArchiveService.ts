import {info} from '../utils/logging';
import MessageRef from '../entities/MessageRef';
import RedisArchiveCache from '../repository/RedisArchiveCache';
import MessageRepository from '../repository/MessageRepository';
import ArchiveCacheFiller from './ArchiveCacheFiller';
import {stringifyMessage} from '../utils/message';
import {Message, TextChannel} from 'discord.js';
import {composeArchiveEmbed} from '../utils/archive';

export default class ArchiveService {
  constructor(private readonly archiveChannel: TextChannel) {}

  /**
   * 주어진 메시지에 대해 이미 만들어진 아카이브를 찾습니다.
   * @param message 아카이브 대상이 되는 원본 메시지
   */
  async findArchive(message: Message) {
    info(`아카이브 검색! ${stringifyMessage(message)}에 대한 아카이브를 찾습니다.`);

    await this.updateCache();

    return await this.findArchiveFromCache(message);
  }

  private async updateCache(): Promise<void> {
    await new ArchiveCacheFiller(this.archiveChannel).fillCache();
  }

  private async findArchiveFromCache(original: Message): Promise<Message | undefined> {
    const messageRef = MessageRef.fromMessage(original);
    const archiveRef = await RedisArchiveCache.getArchiveRef(messageRef);

    if (archiveRef == null) {
      return undefined;
    } else {
      return await MessageRepository.getMessageFromChannel(this.archiveChannel, archiveRef.messageId);
    }
  }

  /**
   * 주어진 메시지에 대해 새로운 아카이브를 생성하거나 기존의 것을 업데이트합니다.
   * @param message 아카이브할 메시지
   */
  async createOrUpdateArchive(message: Message): Promise<Message> {
    const existingArchive = await this.findArchive(message);

    if (existingArchive == null) {
      info(`아카이브 새로 생성! ${stringifyMessage(message)}에 대해 새로운 아카이브를 생성합니다.`);

      return await this.createArchive(message);
    } else {
      info(`아카이브 업데이트! ${stringifyMessage(message)}에 대한 기존 아카이브를 업데이트합니다.`);

      return await this.updateArchive(existingArchive, message);
    }
  }

  private async createArchive(message: Message): Promise<Message> {
    const embed = composeArchiveEmbed(message.guild!!, message);
    const newlyArchived = await this.archiveChannel.send({embeds: [embed]});

    info(`'${this.archiveChannel.name}' 채널에 '${message.id}'에 대한 아카이브 '${newlyArchived.id}'가 생겼습니다.`);

    await RedisArchiveCache.putArchiveRef(MessageRef.fromMessage(message), MessageRef.fromMessage(newlyArchived));

    await RedisArchiveCache.putLastCachedArchiveId(this.archiveChannel, newlyArchived.id);

    return newlyArchived;
  }

  private async updateArchive(archive: Message, message: Message): Promise<Message> {
    return await archive.edit({embeds: [composeArchiveEmbed(message.guild!!, message)]});
  }
}
