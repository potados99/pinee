import {MessageReaction} from 'discord.js';

export default class PinService {
  constructor(private readonly reaction: MessageReaction) {}

  async handleReaction() {
    await this.handleSafe();
  }

  private async handleSafe(retry: number = 0) {
    if (retry > 1) {
      // Allow only one retry.
      return;
    }

    try {
      await this.reaction.message.pin();
    } catch (e) {
      await this.removeOldestPin();

      await this.handleSafe(retry + 1);
    }
  }

  private async removeOldestPin() {
    const channelPins = await this.reaction.message.channel.messages.fetchPinned();

    // Messages come in date descending order: the last one is the oldest.
    const oldest = channelPins.last();
    if (!oldest) {
      return;
    }

    try {
      await oldest.unpin();
    } catch (e: any) {
      console.error(`Unexpected error: ${e.message}`);
    }
  }
}
