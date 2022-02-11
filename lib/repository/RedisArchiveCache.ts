import { createClient } from "redis";
import config from "../../config";
import MessageRef from "../entities/MessageRef";
import { promisify } from "util";

class RedisArchiveCache {
  private readonly client = createClient({ url: this.url });

  private getAsync = promisify(this.client.get).bind(this.client);
  private setAsync = promisify(this.client.set).bind(this.client);

  constructor(private readonly url: string) {
    this.client.on("error", async (e) => {
      console.log("Redis 뻗음!", e);
    });
  }

  async getArchiveRef(original: MessageRef): Promise<MessageRef | undefined> {
    const key = `${original.guildId}/${original.channelId}/${original.messageId}`;

    const value = await this.getAsync(key);

    if (value == null) {
      return undefined;
    }

    const [guildId, channelId, messageId] = value.split("/");

    return new MessageRef(guildId, channelId, messageId);
  }

  async putArchiveRef(original: MessageRef, archive: MessageRef): Promise<void> {
    const key = `${original.guildId}/${original.channelId}/${original.messageId}`;
    const value = `${archive.guildId}/${archive.channelId}/${archive.messageId}`;

    await this.setAsync(key, value);
  }

  async getLastFetchedArchiveId(): Promise<string | undefined> {
    const key = `last-fetched`;

    return await this.getAsync(key) ?? undefined;
  }

  async putLastFetchedArchiveId(id?: string): Promise<void> {
    if (id == null) {
      return;
    }

    const key = `last-fetched`;

    await this.setAsync(key, id);
  }
}

export default new RedisArchiveCache(config.redis.url);
