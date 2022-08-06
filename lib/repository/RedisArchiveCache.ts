import { log } from "../utils/logging";
import { createClient } from "redis";
import config from "../../config";
import MessageRef from "../entities/MessageRef";
import { promisify } from "util";
import { TextChannel } from "discord.js";

class RedisArchiveCache {
  private readonly client = createClient({ url: this.url });

  private getAsync = promisify(this.client.get).bind(this.client);
  private setAsync = promisify(this.client.set).bind(this.client);

  constructor(private readonly url: string) {
    this.client.on("error", async (e) => {
      log("Redis 뻗음!", e);
    });
  }

  async getArchiveRef(original: MessageRef): Promise<MessageRef | undefined> {
    const value = await this.getAsync(original.toString());
    if (value == null) {
      return undefined;
    }

    return MessageRef.fromString(value);
  }

  async putArchiveRef(original: MessageRef, archive: MessageRef): Promise<void> {
    await this.setAsync(original.toString(), archive.toString());
  }

  async getLastFetchedArchiveId(archiveChannel: TextChannel): Promise<string | undefined> {
    const key = `${archiveChannel.guild.id}/${archiveChannel.id}/last-fetched`;

    return await this.getAsync(key) ?? undefined;
  }

  async putLastFetchedArchiveId(archiveChannel: TextChannel, id?: string): Promise<void> {
    if (id == null) {
      return;
    }

    const key = `${archiveChannel.guild.id}/${archiveChannel.id}/last-fetched`;

    await this.setAsync(key, id);
  }
}

export default new RedisArchiveCache(config.services.redis.url);
