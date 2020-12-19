import {
  Channel,
  ChannelLogsQueryOptions,
  DMChannel,
  Guild,
  Message,
  MessageReference,
  NewsChannel,
  TextChannel
} from "discord.js";
import { getChannelName, isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import channelRepo from "./ChannelRepository";
import { inPlaceSortDateAscending } from "../utils/message";
import config from "../../config";

/**
 * Prefix rule:
 *  Search with predicate   ? find : get
 *  Returns list            ? all : .
 */
class MessageRepository {
  async getMessageOfGuild(guild: Guild, channelId: string, messageId: string | null) {
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      return undefined;
    }

    return await this.getMessageOfChannel(channel, messageId);
  }

  async getMessageOfChannel(channel: Channel, messageId: string | null) {
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
  private static async getMessageSafe(channel: TextChannel | NewsChannel | DMChannel, messageId: string | null) {
    if (!messageId) {
      return undefined;
    }

    try {
      return await channel.messages.fetch(messageId);
    } catch (e) {
      console.error(`Couldn't get message '${messageId}': ${e.message}`);
      return undefined;
    }
  }

  async getAllMessagesFromChannel(channel: Channel, progress?: Message) {
    if (!isMessageChannel(channel)) {
      return [];
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return await this.fetchMessages(messageChannel, progress);
  }

  private async fetchMessages(channel: TextChannel | NewsChannel | DMChannel, progress?: Message, limit?: number): Promise<Message[]> {
    if (limit !== undefined && limit <= 100) {
      const allMessages = (await channel.messages.fetch({ limit: limit })).array();
      await progress?.edit(`${channel} 채널에서 1번째 요청으로 ${allMessages.length}개의 메시지를 가져왔습니다.`);

      return allMessages;
    } else {
      return await this.fetchMessagesUnlimited(channel, async (numberOfFetchedMessages, accumulatedRequestCount) => {
        await progress?.edit(`${channel} 채널에서 ${accumulatedRequestCount}번째 요청으로 ${numberOfFetchedMessages}개의 메시지를 가져왔습니다.`);
      });
    }
  }

  /**
   * Discord API limits maximum number of message to fetch to 100 per request.
   * Therefore an unlimited fetch should be divided to bundle of requests,
   * each of them fetch le 100.
   *
   * @param channel
   * @param onEveryRequest
   * @private
   */
  async fetchMessagesUnlimited(
    channel: TextChannel | NewsChannel | DMChannel,
    onEveryRequest: (numberOfFetchedMessages: number, accumulatedRequestCount: number) => void = () => {
    }
  ): Promise<Message[]> {

    const out: Message[] = [];

    await this.forEachMessagesInChannelUnlimited(channel,
      (message) => {
        out.push(message);
      },
      (numberOfFetchedMessages, accumulatedRequestCount) => {
        onEveryRequest(numberOfFetchedMessages, accumulatedRequestCount);
    });

    console.log(`Unlimited fetch: total ${out.length} messages from channel '${getChannelName(channel)}'.`);

    return out;
  }

  async forEachMessagesInChannelUnlimited(
    channel: TextChannel | NewsChannel | DMChannel,
    onMessage: (message: Message) => void,
    onEveryRequest: (numberOfFetchedMessages: number, accumulatedRequestCount: number) => void = () => {
    },
    startingFrom?: string
  ): Promise<void> {

    let lastId: string | undefined = startingFrom;
    let requestsSentCount: number = 0;

    while (true) {
      const options: ChannelLogsQueryOptions = {
        limit: config.api.fetchLimitPerRequest,
        before: lastId // undefined on first request.
      };

      // Request
      let messages;
      try {
        messages = (await channel.messages.fetch(options, false, true)).array();
      } catch (e) {
        console.error(`Unexpected error: ${e.message}`);
        continue;
      }

      console.log(`Unlimited forEach: fetched ${messages.length} messages from channel '${getChannelName(channel)}' on request #${requestsSentCount}.`);

      for (const message of messages) {
        await onMessage(message);
      }

      await onEveryRequest(messages.length, ++requestsSentCount);

      if (messages.length < config.api.fetchLimitPerRequest) {
        break;
      }

      lastId = messages[(messages.length - 1)].id;
    }
  }
}

const messageRepo = new MessageRepository();

export default messageRepo;
