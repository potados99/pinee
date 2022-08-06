import {log} from '../utils/logging';
import DmResponder from '../responder/DmResponder';
import MentionResponder from '../responder/MentionResponder';
import {Client, Message} from 'discord.js';
import {isByThisBot, isFromDm, isMentioningThisBot, stringifyMessage} from '../utils/message';

/**
 * 새 메시지가 도착했을 때에 실행할 동작을 정의합니다.
 * @param client 클라이언트
 * @param message 새 메시지
 */
export async function onMessage(client: Client, message: Message) {
  if (isByThisBot(client, message)) {
    return;
  }

  if (isFromDm(message)) {
    log(`💌 새 DM이 도착하였습니다: ${stringifyMessage(message)}`);

    await new DmResponder(message).handle();
    return;
  }

  if (isMentioningThisBot(client, message)) {
    log(`📨 새 Mention 메시지가 도착하였습니다: ${stringifyMessage(message)}`);

    await new MentionResponder(message).handle();
    return;
  }
}
