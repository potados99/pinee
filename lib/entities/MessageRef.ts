import { Message } from "discord.js";

export default class MessageRef {
  constructor(
    readonly guildId: string,
    readonly channelId: string,
    readonly messageId: string
  ) {
  }

  toString(): string {
    return `${this.guildId}/${this.channelId}/${this.messageId}`;
  }

  static fromMessage(message: Message): MessageRef {
    return new MessageRef(message.guild!!.id, message.channel.id, message.id);
  }

  static fromString(raw: string): MessageRef {
    const [guildId, channelId, messageId] = raw.split("/");

    return new MessageRef(guildId, channelId, messageId);
  }
}
