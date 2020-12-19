import MessageRef from "../entities/MessageRef";
import { createClient, RedisClient } from "redis";
import config from "../../config";
import { promisify } from "util";

class FetchSessionRepository {

  private readonly client: RedisClient;

  constructor(url: string) {
    this.client = createClient({url: url});
  }

  async put(ref: MessageRef) {
    const key = `${ref.guildId}/${ref.channelId}`;
    const value = ref.messageId;

    this.client.sadd(key, value);

    console.log(`[Cache] Put ${key}/${value}`);
  }

  async markFetched(ref: MessageRef, accumulated: number) {
    const key = `${ref.guildId}/${ref.channelId}`;
    const value = ref.messageId;

    this.client.hmset("last_put", key, value);
    this.client.hmset("fetched_total", key, accumulated);

    console.log(`[Cache] Mark ${key}/${value} fetched`);
  }

  async getAll(guildId: string) {
    const references: MessageRef[] = [];

    const keys = await this.findKeysByGuildId(guildId);

    for (const key of keys) {
      const [guildId, channelId] = key.split("/");
      const messageIds = await this.getSetMembers(key);

      for (const messageId of messageIds) {
        references.push(new MessageRef(guildId, channelId, messageId));
      }
    }

    console.log(`[Cache] Gott ${references.length} entries`);

    return references;
  }

  async getAllInChannel(guildId: string, channelId: string) {
    return await this.getSetMembers(`${guildId}/${channelId}`);
  }

  private async findKeysByGuildId(guildId: string) {
    return await this.getKeys(`${guildId}/*`);
  }

  private async getKeys(pattern: string): Promise<string[]> {
    return await promisify(this.client.keys).bind(this.client)(pattern);
  }

  private async getSetMembers(key: string): Promise<string[]> {
    return await promisify(this.client.smembers).bind(this.client)(key);
  }

  async getLastFetchedMessageId(guildId: string, channelId: string) {
    return await this.getHashField("last_put", `${guildId}/${channelId}`);
  }

  async getLastFetchedTotal(guildId: string, channelId: string) {
    const value = await this.getHashField("fetched_total", `${guildId}/${channelId}`);
    return (value !== undefined && Number.isInteger(value)) ? Number.parseInt(value) : 0;
  }

  private async getHashField(key: string, field: string): Promise<string | undefined> {
    // @ts-ignore
    const result = await promisify(this.client.hmget).bind(this.client)(key, field);

    return result.length > 0 ? result[0] : undefined;
  }

  async clear(guildId: string) {
    const keys = await this.findKeysByGuildId(guildId);

    this.client.del(keys);
    this.client.del("last_put");

    console.log(`[Cache] Cleared`);
  }
}

const fetchSessionRepo = new FetchSessionRepository(config.redis.url);

export default fetchSessionRepo;
