import Interactor from './Interactor';
import Discord, {Message, MessageEmbedOptions} from 'discord.js';

/**
 * 사용자에게 말합니다.
 */
export default class TellUser implements Interactor<MessageEmbedOptions, Message> {
  constructor(private readonly message: Message) {}

  public async execute(messageData: MessageEmbedOptions): Promise<Message> {
    return await this.tell(messageData);
  }

  private async tell(messageData: MessageEmbedOptions) {
    const confirmDialogMessage = new Discord.MessageEmbed(messageData);

    return await this.message.reply(confirmDialogMessage);
  }
}
