import RedisArchiveCache from "../repository/RedisArchiveCache";
import MessageRepository from "../repository/MessageRepository";
import { Message, TextChannel } from "discord.js";
import { composeArchiveEmbed, extractOriginalMessageRef } from "../utils/archive";
import MessageRef from "../entities/MessageRef";

export default class ArchiveService {
  constructor(private readonly archiveChannel: TextChannel) {
  }

  async getArchive(message: Message) {
    console.log(`'${message.content}'에 대한 아카이브를 찾습니다.`);

    const firstTry = await this.tryResolveArchiveFromCache(message);
    if (firstTry != null) {
      console.log("캐시 힛!");
      return firstTry;
    }

    console.log("캐시 미스!");

    await this.fillCache();

    const secondTry = await this.tryResolveArchiveFromCache(message);
    if (secondTry != null) {
      console.log("Fetching 후 캐시에서 찾음!");
      return secondTry;
    }

    console.log(`Fetching 후에도 '${message.content}'에 대한 아카이브를 찾지 못하였습니다.`);
  }

  private async tryResolveArchiveFromCache(original: Message): Promise<Message | undefined> {
    const archiveRef = await RedisArchiveCache.getArchiveRef(MessageRef.fromMessage(original));
    if (archiveRef == null) {
      return undefined;
    }

    return await MessageRepository.getMessageFromChannel(this.archiveChannel, archiveRef.messageId);
  }

  private async fillCache(): Promise<void> {
    console.log("Fetching 시작!");

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

    console.log("캐시 채움!");
  }

  async createArchive(message: Message): Promise<Message> {
    console.log(`새 아카이브를 생성합니다.`);

    const embed = composeArchiveEmbed(message.guild!!, message);
    const newlyArchived = await this.archiveChannel.send(embed);

    console.log(`'${this.archiveChannel.name}' 채널에 '${message.id}'에 대한 아카이브 '${newlyArchived.id}'가 생겼습니다.`);

    await RedisArchiveCache.putArchiveRef(
      MessageRef.fromMessage(message),
      MessageRef.fromMessage(newlyArchived)
    );

    await RedisArchiveCache.putLastFetchedArchiveId(this.archiveChannel, newlyArchived.id);

    return newlyArchived;
  }

  async updateArchive(archive: Message, message: Message): Promise<void> {
    console.log(`기존 아카이브를 업데이트합니다.`);

    await archive.edit(composeArchiveEmbed(message.guild!!, message));
  }
};
