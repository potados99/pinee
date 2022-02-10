import Discord, { Message, MessageEmbedOptions } from "discord.js";

export default class TellUser {
  constructor(private readonly message: Message) {
  }

  public async execute(messageData: MessageEmbedOptions) {
    return await this.tell(messageData);
  }

  private async tell(messageData: MessageEmbedOptions) {
    const confirmDialogMessage = new Discord.MessageEmbed(messageData);

    return await this.message.reply(confirmDialogMessage);
  }
}
