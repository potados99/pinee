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
  private async fetchMessagesUnlimited(
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

    console.log(`Unlimited fetch: total ${out.length} messages from channel '${(channel instanceof DMChannel) ? channel.recipient.username : channel.name}'.`);

    return out;
  }

  async forEachMessagesInChannel(
    channel: Channel,
    onMessage: (message: Message) => void,
    onEveryRequest: (numberOfFetchedMessages: number, accumulatedRequestCount: number) => void = () => {
    }) {
    if (!isMessageChannel(channel)) {
      return;
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    await this.forEachMessagesInChannelUnlimited(messageChannel, onMessage, onEveryRequest);
  }

  private async forEachMessagesInChannelUnlimited(
    channel: TextChannel | NewsChannel | DMChannel,
    onMessage: (message: Message) => void,
    onEveryRequest: (numberOfFetchedMessages: number, accumulatedRequestCount: number) => void = () => {
    }
  ): Promise<void> {

    let last_id: string | undefined = undefined;
    let requestsSentCount: number = 0;

    while (true) {
      const options: ChannelLogsQueryOptions = {
        limit: config.api.fetchLimitPerRequest,
        before: last_id // undefined on first request.
      };

      // Request
      const messages = (await channel.messages.fetch(options, false, true)).array();

      console.log(`Unlimited forEach: fetched ${messages.length} messages from channel '${(channel instanceof DMChannel) ? channel.recipient.username : channel.name}' on request #${requestsSentCount}.`);

      for (const message of messages) {
        await onMessage(message);
      }

      await onEveryRequest(messages.length, ++requestsSentCount);

      if (messages.length < config.api.fetchLimitPerRequest) {
        break;
      }

      last_id = messages[(messages.length - 1)].id;
    }
  }

  async getAllCurrentlyPinedMessagesInChannel(channel: TextChannel | NewsChannel | DMChannel, progress?: Message) {
    const allPins = (await channel.messages.fetchPinned()).array();
    await progress?.edit(`${channel} 채널에서 1번째 요청으로 ${allPins.length}개의 메시지를 가져왔습니다.`);

    return allPins;
  }

  async getAllCurrentlyPinedMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPins: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild, (channel) =>
      !publicOnly || !(isNonPublicChannel(channel) || isNsfwChannel(channel))
    );

    for (const channel of allMessageChannels) {
      const pins = await this.getAllCurrentlyPinedMessagesInChannel(channel, progress);
      allPins.push(...pins);
    }

    console.log(`Got ${allPins.length} currently-pinned messages found.`);

    return inPlaceSortDateAscending(allPins);
  }

  async forEachPinSystemMessageInChannel(channel: TextChannel | NewsChannel | DMChannel,
                                         onPinSystemMessage: (message: Message) => void,
                                         onProgressUpdate: (found: number, total: number) => void) {
    let found = 0;
    let total = 0;

    const onMessage = async (message: Message) => {
      if (message.type === "PINS_ADD") {
        onPinSystemMessage(message);

        found++; // No progress update: it's to frequent.
      }
    };

    const onEveryRequest = async (numberOfFetchedMessages: number, _: number) => {
      total += numberOfFetchedMessages;
      await onProgressUpdate(found, total);
    };

    await this.forEachMessagesInChannel(channel, onMessage, onEveryRequest);
  }

  async getAllPinSystemMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPinAddMessages: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild, (channel) =>
      !publicOnly || !(isNonPublicChannel(channel) || isNsfwChannel(channel))
    );

    const onPinSystemMessage = (message: Message) => {
      allPinAddMessages.push(message);
    };

    for (const channel of allMessageChannels) {
      const onProgressUpdate = (found: number, total: number) => {
        console.log(`Got ${found} pin messages of ${total} messages in ${(channel instanceof DMChannel) ? channel.recipient.username : channel.name} channel.`);
        progress?.edit(`${channel} 채널에서 ${total}개의 메시지 중 ${found}개의 고정 메시지를 발견하였습니다.`);
      };

      await this.forEachPinSystemMessageInChannel(channel, onPinSystemMessage, onProgressUpdate);
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
  async getAllOncePinnedMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPinSystemMessages = await this.getAllPinSystemMessagesInGuild(guild, progress, publicOnly);

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
