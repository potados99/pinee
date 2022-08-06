import Responder from './Responder';
import {Message} from 'discord.js';
import SimSimService from '../service/SimSimService';

/**
 * 다이렉트 메시지에 반응하는 responder입니다.
 */
export default class DmResponder implements Responder {
  constructor(private readonly message: Message) {}

  async handle() {
    const answer = await new SimSimService(this.message).getAnswer();

    await this.message.reply(answer);
  }
}
