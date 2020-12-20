import { DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";
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
   *
   * @param guild
   * @param progress
   * @param publicOnly
   */
  async getAllOncePinnedMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const uniqueReferences = await this.getAllPinnedMessageRefsInGuild(guild, progress, publicOnly);

    const originalMessages = [];
    for (const [index, ref] of uniqueReferences.entries()) {
      await progress?.edit(`고정된 ${uniqueReferences.length}개 메시지의 원본을 가져오는 중입니다 (${index + 1}/${uniqueReferences.length}).`);

      const original = await messageRepo.getMessageOfGuild(guild, ref.channelId, ref.messageId);
      originalMessages.push(original);
    }

    // @ts-ignore
    const allOncePinedMessages: Message[] = originalMessages.filter((message) => message);

    const numberOfDeletedMessages = originalMessages.filter((message) => !message).length;

    console.log(`Got ${allOncePinedMessages.length} at-least-once-pinned messages found, ${numberOfDeletedMessages} deleted.`);

    return inPlaceSortDateAscending(allOncePinedMessages);
  }

  private async getAllPinnedMessageRefsInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allMessageChannels = channelRepo.findAllTextChannelsOfGuild(guild, (channel) =>
      !publicOnly || !(isNonPublicChannel(channel) || isNsfwChannel(channel))
    );

    const onPinSystemMessage = async (message: Message) => {
      const { guildID, channelID, messageID } = message.reference!!;
      if (!messageID) {
        return;
      }

      const ref = new MessageRef(guildID, channelID, messageID);
      await fetchSessionRepo.putMessageRef(ref);
    };

    for (const channel of allMessageChannels) {
      const onProgressUpdate = async (found: number, total: number, lastFetchedMessageId?: string) => {
        console.log(`Got ${found} pin messages of ${total} messages in '${getChannelName(channel)}' channel.`);

        if (lastFetchedMessageId) {
          /**
           * Mark that messages until lastFetchedMessageId are fetched and PROCESSED.
           * Meaning that a new message pinned in a recent 100 group will be ignored.
           */
          await fetchSessionRepo.markFetched(new MessageRef(guild.id, channel.id, lastFetchedMessageId), total);
        }
        await progress?.edit(`${channel} 채널에서 ${total}개의 메시지 중 ${found}개의 고정 메시지를 발견하였습니다.`);
      };

      const lastId = await fetchSessionRepo.getLastFetchedIdInChannel(guild.id, channel.id);
      if (lastId) {
        console.log(`Fetch starts from last id '${lastId}' on '${getChannelName(channel)}' channel: already fetched and processed ${await fetchSessionRepo.getFetchedTotalInChannel(guild.id, channel.id)}).`);
      }

      await this.forEachPinSystemMessageInChannel(channel, onPinSystemMessage, onProgressUpdate, lastId);
    }

    // Duplication automatically removed :)
    return await fetchSessionRepo.getAllMessageRefsInGuild(guild.id);
  }

  private async forEachPinSystemMessageInChannel(
    channel: TextChannel | NewsChannel,
    onPinSystemMessage: (message: Message) => void,
    onProgressUpdate: (found: number, total: number, lastFetchedMessageId?: string) => void,
    startingFrom?: string) {

    let found = (await fetchSessionRepo.getAllMessageRefsInChannel(channel.guild.id, channel.id)).length;
    let total = (await fetchSessionRepo.getFetchedTotalInChannel(channel.guild.id, channel.id));

    const onMessage = async (message: Message) => {
      if (message.type === "PINS_ADD") {
        await onPinSystemMessage(message);

        found++; // No progress update: it's to frequent.
      }
    };

    const onEveryRequest = async (numberOfFetchedMessages: number, _: number, lastFetchedMessageId?: string) => {
      total += numberOfFetchedMessages;
      await onProgressUpdate(found, total, lastFetchedMessageId);
    };

    if (!isMessageChannel(channel)) {
      return;
    }

    /**
     * onEveryRequest will be called after onMessage called for every fetched message.
     * Meaning that at the moment onEveryRequest is called, message processing for that fetch is already finished.
     */
    await messageRepo.forEachMessagesInChannelUnlimited(channel, onMessage, onEveryRequest, startingFrom);
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
