import { Channel, Client, DMChannel, Guild, Message, MessageReference, NewsChannel, TextChannel } from "discord.js";
import { isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import channelRepo from "./ChannelRepository";
import { inPlaceSortDateAscending } from "../utils/message";

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

  async getAllMessagesOfChannel(channel: Channel) {
    if (!isMessageChannel(channel)) {
      return [];
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return (await messageChannel.messages.fetch()).array();
  }

  async getAllCurrentlyPinedMessagesOfChannel(channel: TextChannel | NewsChannel | DMChannel) {
    return (await channel.messages.fetchPinned()).array();
  }

  async getAllCurrentlyPinedMessagesOfGuild(guild: Guild, publicOnly: boolean = false) {
    const allPins: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild);

    for (const channel of allMessageChannels) {
      if (publicOnly && (isNonPublicChannel(channel) || isNsfwChannel(channel))) {
        continue;
      }

      const pins = await this.getAllCurrentlyPinedMessagesOfChannel(channel);
      allPins.push(...pins);
    }

    console.log(`Got ${allPins.length} currently-pinned messages found.`);

    return inPlaceSortDateAscending(allPins);
  }

  async getAllPinSystemMessagesOfChannel(channel: TextChannel | NewsChannel | DMChannel) {
    const allMessages = (await channel.messages.fetch()).array();

    return allMessages.filter((message) => message.type === "PINS_ADD");
  }

  async getAllPinSystemMessagesOfGuild(guild: Guild) {
    const allPinAddMessages: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild);

    for (const channel of allMessageChannels) {
      const pinAddMessages = await this.getAllPinSystemMessagesOfChannel(channel);

      allPinAddMessages.push(...pinAddMessages);
    }

    return inPlaceSortDateAscending(allPinAddMessages);
  }

  /**
   * Get all messages pinned for at least once.
   * This includes unpinned messages.
   * Does not include deleted messages.
   * @param guild
   * @param publicOnly
   */
  async getAllOncePinnedMessagesOfGuild(guild: Guild, publicOnly: boolean = false) {
    const allPinSystemMessages = await this.getAllPinSystemMessagesOfGuild(guild);

    console.log(`allPinSystemMessages: ${allPinSystemMessages.length}`);

    // @ts-ignore
    const allReferences: MessageReference[] = allPinSystemMessages
      .map(message => message.reference)
      .filter((ref) => ref);

    console.log(`allReferences: ${allReferences.length}`);

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
