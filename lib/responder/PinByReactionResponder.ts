import Responder from "./Responder";
import { Client, MessageReaction } from "discord.js";

export default class PinByReactionResponder implements Responder {

  private readonly client: Client;
  private readonly reaction: MessageReaction;

  constructor(client: Client, reaction: MessageReaction) {
    this.client = client;
    this.reaction = reaction;
  }

  public async handle() {
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
    } catch (e) {
      console.error(`Unexpected error: ${e.message}`);
    }
  }
}
