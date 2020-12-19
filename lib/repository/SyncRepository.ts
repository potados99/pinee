import { Channel, DMChannel, Guild, Message, MessageReference, NewsChannel, TextChannel } from "discord.js";
import channelRepo from "./ChannelRepository";
import { isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import { inPlaceSortDateAscending } from "../utils/message";
import messageRepo from "./MessageRepository";

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
    const allPinSystemMessages = await this.getAllPinSystemMessagesInGuild(guild, progress, publicOnly);

    // @ts-ignore
    const allReferences: MessageReference[] = allPinSystemMessages
      .map(message => message.reference)
      .filter((ref) => ref);

    const uniqueReferences = this.removeDuplicates(allReferences);

    const originalMessages = await Promise.all(
      uniqueReferences
        .map((ref) => messageRepo.getMessageOfGuild(guild, ref!!.channelID, ref!!.messageID))
    );

    // @ts-ignore
    const allOncePinedMessages: Message[] = originalMessages
      .filter((message) => message);

    const numberOfDeletedMessages = originalMessages.filter((message) => !message).length;

    console.log(`Got ${allOncePinedMessages.length} at-least-once-pinned messages found, ${numberOfDeletedMessages} deleted.`);

    return inPlaceSortDateAscending(allOncePinedMessages);
  }

  private async getAllPinSystemMessagesInGuild(guild: Guild, progress?: Message, publicOnly: boolean = false) {
    const allPinAddMessages: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild, (channel) =>
      !publicOnly || !(isNonPublicChannel(channel) || isNsfwChannel(channel))
    );

    const onPinSystemMessage = (message: Message) => {
      allPinAddMessages.push(message);
    };

    for (const channel of allMessageChannels) {
      const onProgressUpdate = (found: number, total: number) => {
        console.log(`Got ${found} pin messages of ${total} messages in '${(channel instanceof DMChannel) ? channel.recipient.username : channel.name}' channel.`);

        progress?.edit(`${channel} 채널에서 ${total}개의 메시지 중 ${found}개의 고정 메시지를 발견하였습니다.`);
      };

      await this.forEachPinSystemMessageInChannel(channel, onPinSystemMessage, onProgressUpdate);
    }

    return inPlaceSortDateAscending(allPinAddMessages);
  }

  private async forEachPinSystemMessageInChannel(
    channel: TextChannel | NewsChannel | DMChannel,
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

    if (!isMessageChannel(channel)) {
      return;
    }

    await messageRepo.forEachMessagesInChannelUnlimited(channel, onMessage, onEveryRequest);
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
