import Discord, { Client, Message, MessageEmbedOptions } from "discord.js";

export default class TellUser {

  private client: Client;
  private message: Message;

  constructor(client: Client, message: Message, onlyAllowAnswerFromOwner: boolean = false) {
    this.client = client;
    this.message = message;
  }

  public async execute(messageData: MessageEmbedOptions) {
    return await this.tell(messageData);
  }

  private async tell(messageData: MessageEmbedOptions) {
    const confirmDialogMessage = new Discord.MessageEmbed(messageData);

    return await this.message.reply(confirmDialogMessage);
  }
}
