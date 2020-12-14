import {
  Channel,
  ChannelLogsQueryOptions,
  Client,
  DMChannel,
  Guild,
  Message,
  MessageReference,
  NewsChannel,
  TextChannel
} from "discord.js";
import { isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import channelRepo from "./ChannelRepository";
import { inPlaceSortDateAscending } from "../utils/message";
import config from "../../config";

/**
 * Prefix rule:
 *  Search with predicate   ? find : get
 *  Returns list            ? all : .
 */
class MessageRepository {
  async getMessage(client: Client, guildId: string, channelId: string, messageId: string | null) {
    const guild = await client.guilds.fetch(guildId);

    return this.getMessageOfGuild(guild, channelId, messageId);
  }

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
      return await MessageRepository.fetchMessagesUnlimited(channel, async (numberOfFetchedMessages, accumulatedRequestCount) => {
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
  private static async fetchMessagesUnlimited(
    channel: TextChannel | NewsChannel | DMChannel,
    onEveryRequest: (numberOfFetchedMessages: number, accumulatedRequestCount: number) => void = () => {
    }
  ): Promise<Message[]> {

    const out: Message[] = [];

    let last_id: string | undefined = undefined;
    let requestsSentCount: number = 0;

    while (true) {
      const options: ChannelLogsQueryOptions = {
        limit: config.api.fetchLimitPerRequest,
        before: last_id // undefined on first request.
      };

      // Request
      const messages = (await channel.messages.fetch(options)).array();
      out.push(...messages);

      await onEveryRequest(messages.length, ++requestsSentCount);

      if (messages.length < config.api.fetchLimitPerRequest) {
        break;
      }

      last_id = messages[(messages.length - 1)].id;
    }

    console.log(`Unlimited fetch: got ${out.length} messages from channel '${(channel instanceof DMChannel) ? channel.recipient.username : channel.name}' within ${requestsSentCount} request(s)`);

    return out;
  }

  async getAllCurrentlyPinedMessagesOfChannel(channel: TextChannel | NewsChannel | DMChannel, progress?: Message) {
    const allPins = (await channel.messages.fetchPinned()).array();
    await progress?.edit(`${channel} 채널에서 1번째 요청으로 ${allPins.length}개의 메시지를 가져왔습니다.`);
    
    return allPins;
  }

  async getAllCurrentlyPinedMessagesOfGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPins: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild);

    for (const channel of allMessageChannels) {
      if (publicOnly && (isNonPublicChannel(channel) || isNsfwChannel(channel))) {
        continue;
      }

      const pins = await this.getAllCurrentlyPinedMessagesOfChannel(channel, progress);
      allPins.push(...pins);
    }

    console.log(`Got ${allPins.length} currently-pinned messages found.`);

    return inPlaceSortDateAscending(allPins);
  }

  async getAllPinSystemMessagesOfChannel(channel: TextChannel | NewsChannel | DMChannel, progress?: Message) {
    const allMessages = await this.getAllMessagesFromChannel(channel, progress);

    return allMessages.filter((message) => message.type === "PINS_ADD");
  }

  async getAllPinSystemMessagesOfGuild(guild: Guild, progress?: Message) {
    const allPinAddMessages: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild);

    for (const channel of allMessageChannels) {
      const pinAddMessages = await this.getAllPinSystemMessagesOfChannel(channel, progress);

      allPinAddMessages.push(...pinAddMessages);
    }

    return inPlaceSortDateAscending(allPinAddMessages);
  }

  /**
   * Get all messages pinned for at least once.
   * This includes unpinned messages.
   * Does not include deleted messages.
   * @param guild
   * @param progress
   * @param publicOnly
   */
  async getAllOncePinnedMessagesOfGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPinSystemMessages = await this.getAllPinSystemMessagesOfGuild(guild, progress);

    // @ts-ignore
    const allReferences: MessageReference[] = allPinSystemMessages
      .map(message => message.reference)
      .filter((ref) => ref);

    const uniqueReferences = this.removeDuplicates(allReferences);

    const originalMessages = await Promise.all(
      uniqueReferences
        .map((ref) => this.getMessageOfGuild(guild, ref!!.channelID, ref!!.messageID))
    );

    // @ts-ignore
    const allOncePinedMessages: Message[] = originalMessages
      .filter((message) => message);

    const numberOfDeletedMessages = originalMessages.filter((message) => !message).length;

    console.log(`Got ${allOncePinedMessages.length} at-least-once-pinned messages found, ${numberOfDeletedMessages} deleted.`);

    return inPlaceSortDateAscending(allOncePinedMessages);
  }

  private removeDuplicates(references: MessageReference[]) {
    const unique: MessageReference[] = [];

    for (const ref of references) {
      if (unique.find((r) => (
        r.guildID === ref.guildID &&
        r.channelID === ref.channelID &&
        r.messageID === ref.messageID))) {
        continue;
      }

      unique.push(ref);
    }

    return unique;
  }
}

const messageRepo = new MessageRepository();

export default messageRepo;
