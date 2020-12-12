import { Channel, Client, DMChannel, Guild, Message, NewsChannel, TextChannel } from "discord.js";
import { isMessageChannel, isNonPublicChannel, isNsfwChannel } from "../utils/channel";
import channelRepo from "./ChannelRepository";
import { inPlaceSortDateAscending } from "../utils/message";

/**
 * Prefix rule:
 *  Search with predicate   ? find : get
 *  Returns list            ? all : .
 */
class MessageRepository {
  async findMessage(client: Client, guildId: string, channelId: string, messageId: string) {
    const guild = await client.guilds.fetch(guildId);

    return this.findMessageOfGuild(guild, channelId, messageId);
  }

  async findMessageOfGuild(guild: Guild, channelId: string, messageId: string) {
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      return null;
    }

    return await this.findMessageOfChannel(channel, messageId);
  }

  async findMessageOfChannel(channel: Channel, messageId: string) {
    if (!isMessageChannel(channel)) {
      return null;
    }

    // @ts-ignore
    // Safe to force casting.
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return await messageChannel.messages.fetch(messageId);
  }

  async getAllPinedMessagesOfChannel(channel: TextChannel|NewsChannel|DMChannel) {
    return (await channel.messages.fetchPinned()).array();
  }

  async getAllPinedMessagesOfGuild(guild: Guild, publicOnly: boolean = false) {
    const allPins: Message[] = [];
    const allMessageChannels = channelRepo.findAllMessageChannelsOfGuild(guild);

    for (const channel of allMessageChannels) {
      if (publicOnly && (isNonPublicChannel(channel) || isNsfwChannel(channel))) {
        continue;
      }

      const pins = await this.getAllPinedMessagesOfChannel(channel);
      allPins.push(...pins);
    }

    return inPlaceSortDateAscending(allPins);
  }

  async getAllPinSystemMessagesOfChannel(channel: TextChannel|NewsChannel|DMChannel) {
    const allMessages = (await channel.messages.fetch()).array();

    return allMessages.filter((message) => message.type === 'PINS_ADD');
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
}

const messageRepo = new MessageRepository();

export default messageRepo;
