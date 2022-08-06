import MessageRef from '../entities/MessageRef';
import {log, warn} from '../utils/logging';
import RedisArchiveCache from '../repository/RedisArchiveCache';
import MessageRepository from '../repository/MessageRepository';
import {stringifyMessage} from '../utils/message';
import {Message, TextChannel} from 'discord.js';
import {extractOriginalMessageRef} from '../utils/archive';

/**
 * 아카이브 채널의 아카이브들에 대해,
 * 아카이브 메시지와 원본 메시지의 연결을 캐시에 저장해주는 객체입니다.
 */
export default class ArchiveCacheFiller {
  constructor(private readonly archiveChannel: TextChannel) {}

  /**
   * 캐시를 채워줍니다.
   * 캐시되지 않은 아카이브들에 대해서만 아카이브-원본 연결 정보를 캐시해줍니다.
   */
  async fillCache() {
    const uncachedArchives = await this.loadUncachedArchives();
    if (uncachedArchives.length === 0) {
      log('캐시할 아카이브가 없어 작업을 중단합니다.');
      return;
    }

    await this.cacheArchives(uncachedArchives);

    await this.markArchivesCached(uncachedArchives);
  }

  private async loadUncachedArchives(): Promise<Message[]> {
    log(
      '캐시되지 않은 아카이브들을 가져옵니다. 아카이브 채널의 메시지 중 가장 마지막으로 캐시한 것 이후부터 가져옵니다.'
    );

    const lastId = await RedisArchiveCache.getLastCachedArchiveId(this.archiveChannel);

    log(`아카이브 채널에서 가장 마지막으로 캐시한 메시지의 식별자는 '${lastId}'입니다.`);

    const allArchives = await MessageRepository.getAllMessagesFromChannel(
      this.archiveChannel,
      lastId
    );

    log(
      `아카이브 채널에서 '${lastId}' 이후로 ${allArchives.length}개의 캐시되지 않은 메시지를 가져왔습니다.`
    );

    return allArchives;
  }

  private async cacheArchives(uncachedArchives: Message[]): Promise<void> {
    log(
      `가져온 ${uncachedArchives.length}개의 아카이브에 대해 원본 메시지와 아카이브의 연결을 캐시에 기록해줍니다.`
    );

    for (const archive of uncachedArchives) {
      const archiveRef = MessageRef.fromMessage(archive);
      const originalRef = extractOriginalMessageRef(archive);

      if (originalRef == null) {
        warn(
          `아카이브인 ${stringifyMessage(
            archive
          )}가 가리키는 원본 메시지의 정보를 가져오지 못 하였습니다. 이 아카이브는 넘어갑니다.`
        );
        continue;
      }

      log(
        `아카이브 '${archiveRef.toString()}'의 원본은 '${originalRef.toString()}'입니다. 이 사실을 캐시에 기록합니다.`
      );

      await RedisArchiveCache.putArchiveRef(originalRef, archiveRef);
    }
  }

  private async markArchivesCached(archives: Message[]): Promise<void> {
    const theMostRecent = archives[0];

    log(
      `새로 캐시한 ${archives.length}개의 아카이브 중 가장 최근 것의 식별자인 '${theMostRecent.id}'를 기록해줍니다.`
    );

    await RedisArchiveCache.putLastCachedArchiveId(this.archiveChannel, theMostRecent.id);
  }
}
