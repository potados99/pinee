import config from '../../config';
import Interactor from './Interactor';
import AskUserWithOptions from './AskUserWithOptions';
import {EmbedData, Message} from 'discord.js';

/**
 * 긍정과 부정 중 하나를 선택하도록 사용자에게 물어보는 상호작용입니다.
 */
export default class AskUserBoolean implements Interactor<EmbedData, Boolean> {
  constructor(private readonly message: Message, private readonly onlyForOwner: boolean = false) {}

  public async execute(messageData: EmbedData): Promise<Boolean> {
    const reply = await new AskUserWithOptions(this.message, {
      choices: ['✅', '❌'],
      onlyForOwner: this.onlyForOwner,
      replyTimeout: config.behaviors.interaction.confirm.timeoutMillis,
    }).execute(messageData);

    return !!reply && reply === '✅';
  }
}
