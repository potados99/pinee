import Interactor from './Interactor';
import {EmbedBuilder, EmbedData, Message} from 'discord.js';

/**
 * 사용자에게 말합니다.
 */
export default class TellUser implements Interactor<EmbedData, Message> {
  constructor(private readonly message: Message) {}

  public async execute(messageData: EmbedData): Promise<Message> {
    return await this.tell(messageData);
  }

  private async tell(messageData: EmbedData) {
    const confirmDialogMessage = new EmbedBuilder(messageData);

    return await this.message.reply({embeds: [confirmDialogMessage]});
  }
}
