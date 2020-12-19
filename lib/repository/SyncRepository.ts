import { Channel, DMChannel, Guild, Message, MessageReference, NewsChannel, TextChannel } from "discord.js";
import channelRepo from "./ChannelRepository";
import { getChannelName, isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import { inPlaceSortDateAscending } from "../utils/message";
import messageRepo from "./MessageRepository";
import MessageRef from "../entities/MessageRef";
import fetchSessionRepo from "./FetchSessionRepository";

class SyncRepository {

  /**
   * Get all messages pinned for at least once.
   * This includes unpinned messages.
   * Does not include deleted messages.
   * @param guild
   * @param progress
   * @param publicOnly
   */
  async getAllOncePinnedMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allReferences = await this.getAllPinnedMessageRefsInGuild(guild, progress, publicOnly);

    const uniqueReferences = this.removeDuplicates(allReferences);

    const originalMessages = await Promise.all(
      uniqueReferences.map((ref) => messageRepo.getMessageOfGuild(guild, ref.channelId, ref.messageId))
    );

    // @ts-ignore
    const allOncePinedMessages: Message[] = originalMessages.filter((message) => message);

    const numberOfDeletedMessages = originalMessages.filter((message) => !message).length;

    console.log(`Got ${allOncePinedMessages.length} at-least-once-pinned messages found, ${numberOfDeletedMessages} deleted.`);

    return inPlaceSortDateAscending(allOncePinedMessages);
  }

  private async getAllPinnedMessageRefsInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPinAddMessages: MessageRef[] = [];

    /**
     * Restore procedure
     */
    const restored = await fetchSessionRepo.getAll(guild.id);
    allPinAddMessages.push(...restored);

    if (restored.length > 0) {
      console.log(`Restored ${restored.length} messages from last session.`);
    }

    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild, (channel) =>
      !publicOnly || !(isNonPublicChannel(channel) || isNsfwChannel(channel))
    );

    const onPinSystemMessage = async (message: Message) => {
      const {guildID, channelID, messageID} = message.reference!!;
      if (!messageID) {
        return;
      }

      const ref = new MessageRef(guildID, channelID, messageID);
      allPinAddMessages.push(ref);
      await fetchSessionRepo.put(ref);
    };

    for (const channel of allMessageChannels) {
      const onProgressUpdate = async (found: number, total: number) => {
        console.log(`Got ${found} pin messages of ${total} messages in '${getChannelName(channel)}' channel.`);

        await progress?.edit(`${channel} 채널에서 ${total}개의 메시지 중 ${found}개의 고정 메시지를 발견하였습니다.`);
      };

      const lastId = await fetchSessionRepo.getLastPutMessageId(guild.id, channel.id);
      if (lastId) {
        console.log(`Fetch starts from last id '${lastId}' on '${getChannelName(channel)}' channel.`);
      }

      await this.forEachPinSystemMessageInChannel(channel, onPinSystemMessage, onProgressUpdate, lastId);
    }

    return allPinAddMessages;
  }

  private async forEachPinSystemMessageInChannel(
    channel: TextChannel | NewsChannel | DMChannel,
    onPinSystemMessage: (message: Message) => void,
    onProgressUpdate: (found: number, total: number) => void,
    startingFrom?: string) {
    let found = 0;
    let total = 0;

    const onMessage = async (message: Message) => {
      if (message.type === "PINS_ADD") {
        await onPinSystemMessage(message);

        found++; // No progress update: it's to frequent.
      }
    };

    const onEveryRequest = async (numberOfFetchedMessages: number, _: number) => {
      total += numberOfFetchedMessages;
      await onProgressUpdate(found, total);
    };

    if (!isMessageChannel(channel)) {
      return;
    }

    await messageRepo.forEachMessagesInChannelUnlimited(channel, onMessage, onEveryRequest, startingFrom);
  }

  private removeDuplicates(references: MessageRef[]) {
    const unique: MessageRef[] = [];

    for (const ref of references) {
      if (unique.find((r) => (
        r.guildId === ref.guildId &&
        r.channelId === ref.channelId &&
        r.messageId === ref.messageId))) {
        continue;
      }

      unique.push(ref);
    }

    return unique;
  }

  /**
   * Get all currently pinned messages.
   * @param guild
   * @param progress
   * @param publicOnly
   */
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

  private async getAllCurrentlyPinedMessagesInChannel(channel: TextChannel | NewsChannel | DMChannel, progress?: Message) {
    const allPins = (await channel.messages.fetchPinned()).array();
    await progress?.edit(`${channel} 채널에서 1번째 요청으로 ${allPins.length}개의 메시지를 가져왔습니다.`);

    return allPins;
  }
}

const syncRepo = new SyncRepository();

export default syncRepo;
