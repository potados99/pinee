import { Message } from "discord.js";

export default class MessageRef {
  constructor(
    readonly guildId: string,
    readonly channelId: string,
    readonly messageId: string
  ) {
  }

  static fromMessage(message: Message): MessageRef {
    return new MessageRef(message.guild!!.id, message.channel.id, message.id);
  }
}
