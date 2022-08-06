import {Message, MessageEmbedOptions} from 'discord.js';
import config from '../../config';
import AskUserWithOptions from './AskUserWithOptions';
import AskOptions from './AskOptions';

export default class AskUserBoolean {
  private readonly options: AskOptions = {
    choices: ['✅', '❌'],
    onlyForOwner: this.onlyForOwner,
    replyTimeout: config.behaviors.interaction.confirm.timeoutMillis,
  };

  constructor(private readonly message: Message, private readonly onlyForOwner: boolean = false) {}

  public async execute(messageData: MessageEmbedOptions) {
    const reply = await new AskUserWithOptions(this.message, this.options).execute(messageData);

    return !!reply && reply === '✅';
  }
}
