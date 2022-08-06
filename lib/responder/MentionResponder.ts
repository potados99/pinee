import {Message} from 'discord.js';
import Responder from './Responder';
import SimSimService from '../service/SimSimService';

/**
 * 봇이 언급된 메시지에 반응하는 responder입니다.
 */
export default class MentionResponder implements Responder {
  constructor(private readonly message: Message) {}

  async handle() {
    const answer = await new SimSimService(this.message).getAnswer();

    await this.message.reply(answer);
  }
}
