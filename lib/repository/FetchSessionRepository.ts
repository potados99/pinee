import config from "../../config";
import MessageRef from "../entities/MessageRef";
import { createClient, RedisClient } from "redis";

class FetchSessionRepository {

  private readonly client: RedisClient;

  constructor() {
    this.client = createClient(config.redis.url);
  }

  async put(ref: MessageRef) {
    const key = `${ref.channelId}/${ref.guildId}`;
    const value = `${ref.messageId}`;

    this.client.sadd(key, value);
  }

  async getAll(guildId: string) {
    const references: MessageRef[] = [];

    const keys = await this.findKeysByGuildId(guildId);

    for (const key of keys) {
      const [guildId, channelId] = key.split('/');
      const messageIds = await this.getSetMembers(key);

      for (const messageId of messageIds) {
        references.push(new MessageRef(guildId, channelId, messageId));
      }
    }

    return references;
  }

  private async findKeysByGuildId(guildId: string) {
    return await this.getKeys(`${guildId}/*`);
  }

  private async getKeys(pattern: string): Promise<string[]> {
    return await new Promise((resolve, reject) => {
      this.client.keys(pattern, (error, keys) => {
        if (error) {
          reject(error);
        }
        resolve(keys);
      });
    });
  }

  private async getSetMembers(key: string): Promise<string[]> {
    return await new Promise((resolve, reject) => {
      this.client.smembers(key, (error, keys) => {
        if (error) {
          reject(error);
        }
        resolve(keys);
      });
    });
  }

  async clear(guildId: string) {
    const keys = await this.findKeysByGuildId(guildId);

    this.client.del(keys);
  }
}

const syncSessionRepo = new FetchSessionRepository();

export default syncSessionRepo;
