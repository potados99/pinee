import config from '../../config';
import {error} from '../utils/logging';
import MessageRef from '../entities/MessageRef';
import {promisify} from 'util';
import {TextChannel} from 'discord.js';
import {createClient} from 'redis';

/**
 * 원본 메시지와 아카이브의 연결을 저장하는 Redis 캐시입니다.
 */
class RedisArchiveCache {
  private readonly client = createClient({url: this.url});

  private getAsync = promisify(this.client.get).bind(this.client);
  private setAsync = promisify(this.client.set).bind(this.client);

  constructor(private readonly url: string) {
    this.client.on('error', async (e) => {
      error('Redis 뻗음!', e);
    });
  }

  /**
   * 주어진 원본 메시지의 MessageRef에 대응되는 아카이브의 MessageRef를 가져옵니다.
   * @param original 원본 메시지의 MessageRef
   */
  async getArchiveRef(original: MessageRef): Promise<MessageRef | undefined> {
    const value = await this.getAsync(original.toString());
    if (value == null) {
      return undefined;
    }

    return MessageRef.fromString(value);
  }

  /**
   * 원본 메시지의 MessageRef에 아카이브의 MessageRef를 짝지어 저장합니다.
   * @param original 원본 메시지의 MessageRef
   * @param archive 아카이브의 MessageRef
   */
  async putArchiveRef(original: MessageRef, archive: MessageRef): Promise<void> {
    await this.setAsync(original.toString(), archive.toString());
  }

  /**
   * 주어진 아카이브 채널에서 가장 마지막으로 캐시된 아카이브의 식별자를 가져옵니다.
   * @param archiveChannel 아카이브 채널
   */
  async getLastCachedArchiveId(archiveChannel: TextChannel): Promise<string | undefined> {
    const key = `${archiveChannel.guild.id}/${archiveChannel.id}/last-cached`;

    return (await this.getAsync(key)) ?? undefined;
  }

  /**
   * 주어진 아카이브 채널에서 가장 마지막으로 캐시된 아카이브의 식별자를 저장합니다.
   * @param archiveChannel 아카이브 채널
   * @param id 아카이브의 식별자
   */
  async putLastCachedArchiveId(archiveChannel: TextChannel, id?: string): Promise<void> {
    if (id == null) {
      return;
    }

    const key = `${archiveChannel.guild.id}/${archiveChannel.id}/last-cached`;

    await this.setAsync(key, id);
  }
}

export default new RedisArchiveCache(config.services.redis.url);
