import { Channel, DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";
import { isMessageChannel } from "../utils/channel";
import MessageFetcher from "../utils/MessageFetcher";

/**
 * Prefix rule:
 *  Search with predicate   ? find : get
 *  Returns list            ? all : .
 */
class MessageRepository {
  async getMessageFromGuildAndChannel(guild: Guild, channelId: string, messageId?: string) {
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      return undefined;
    }

    return await this.getMessageFromChannel(channel, messageId);
  }

  async getMessageFromChannel(channel: Channel, messageId?: string) {
    if (!isMessageChannel(channel)) {
      return undefined;
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return MessageRepository.getMessageSafe(messageChannel, messageId);
  }

  /**
   * If the message is deleted, API call will throw.
   * This is a wrapper that returns undefined when the call throws.
   * @param channel
   * @param messageId
   * @private
   */
  private static async getMessageSafe(channel: TextChannel | NewsChannel | DMChannel, messageId?: string) {
    if (!messageId) {
      return undefined;
    }

    try {
      return await channel.messages.fetch(messageId);
    } catch (e: any) {
      console.error(`메시지 '${messageId}'를 가져올 수 없습니다: ${e.message}`);
      return undefined;
    }
  }

  async getAllMessagesFromChannel(channel: Channel, until?: string, progress?: Message) {
    if (!isMessageChannel(channel)) {
      return [];
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return await this.fetchMessages(messageChannel, until, progress);
  }

  private async fetchMessages(
    channel: TextChannel | NewsChannel | DMChannel,
    until?: string,
    progress?: Message
  ): Promise<Message[]> {
    return await new MessageFetcher(channel).fetch(async (numberOfFetchedMessages, accumulatedRequestCount) => {
      await progress?.edit(`${channel} 채널에서 ${accumulatedRequestCount}번째 요청으로 ${numberOfFetchedMessages}개의 메시지를 가져왔습니다.`);
    }, until);
  }
}

export default new MessageRepository();
