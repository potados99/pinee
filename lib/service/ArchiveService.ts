import { log } from "../utils/logging";
import MessageRef from "../entities/MessageRef";
import RedisArchiveCache from "../repository/RedisArchiveCache";
import MessageRepository from "../repository/MessageRepository";
import { Message, TextChannel } from "discord.js";
import { composeArchiveEmbed, extractOriginalMessageRef } from "../utils/archive";

export default class ArchiveService {
  constructor(private readonly archiveChannel: TextChannel) {
  }

  /**
   * 주어진 메시지에 대해 이미 만들어진 아카이브를 찾습니다.
   * @param message 아카이브 대상이 되는 원본 메시지
   */
  async getArchive(message: Message) {
    log(`내용이 '${message.content}'인 메시지에 대한 아카이브를 찾습니다.`);

    const firstTry = await this.tryResolveArchiveFromCache(message);
    if (firstTry != null) {
      log("캐시 힛!");
      return firstTry;
    }

    log("캐시 미스!");

    await this.fillCache();

    const secondTry = await this.tryResolveArchiveFromCache(message);
    if (secondTry != null) {
      log("Fetching 후 캐시에서 찾음!");
      return secondTry;
    }

    log(`Fetching 후에도 '${message.content}'에 대한 아카이브를 찾지 못하였습니다.`);
  }

  private async tryResolveArchiveFromCache(original: Message): Promise<Message | undefined> {
    const messageRef = MessageRef.fromMessage(original);
    const archiveRef = await RedisArchiveCache.getArchiveRef(messageRef);

    if (archiveRef == null) {
      return undefined;
    }

    return await MessageRepository.getMessageFromChannel(this.archiveChannel, archiveRef.messageId);
  }

  private async fillCache(): Promise<void> {
    log("캐시를 채웁니다. Fetching 시작!");

    const lastId = await RedisArchiveCache.getLastFetchedArchiveId(this.archiveChannel);

    const allArchives = await MessageRepository.getAllMessagesFromChannel(this.archiveChannel, lastId);

    for (const archive of allArchives) {
      const originalRef = extractOriginalMessageRef(archive);
      if (originalRef == null) {
        continue;
      }

      const archiveRef = MessageRef.fromMessage(archive);

      await RedisArchiveCache.putArchiveRef(originalRef, archiveRef);
    }

    await RedisArchiveCache.putLastFetchedArchiveId(this.archiveChannel, allArchives[0]?.id/*가장 최근*/);

    log("캐시 채움!");
  }

  async createArchive(message: Message): Promise<Message> {
    log(`새 아카이브를 생성합니다.`);

    const embed = composeArchiveEmbed(message.guild!!, message);
    const newlyArchived = await this.archiveChannel.send(embed);

    log(`'${this.archiveChannel.name}' 채널에 '${message.id}'에 대한 아카이브 '${newlyArchived.id}'가 생겼습니다.`);

    await RedisArchiveCache.putArchiveRef(
      MessageRef.fromMessage(message),
      MessageRef.fromMessage(newlyArchived)
    );

    await RedisArchiveCache.putLastFetchedArchiveId(this.archiveChannel, newlyArchived.id);

    return newlyArchived;
  }

  async updateArchive(archive: Message, message: Message): Promise<void> {
    log(`기존 아카이브를 업데이트합니다.`);

    await archive.edit(composeArchiveEmbed(message.guild!!, message));
  }
};
