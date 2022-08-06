import {log} from '../utils/logging';
import {isArchived} from '../utils/archive';
import {Client, Message} from 'discord.js';
import PinMessageUpdateResponder from '../responder/PinMessageUpdateResponder';
import {isByThisBot, isFromDm, isPinned, stringifyMessage} from '../utils/message';

/**
 * 기존 메시지가 변경되었을 때에 실행할 동작을 정의합니다.
 * @param client 클라이언트
 * @param before 변경 전 메시지
 * @param after 변경 후 메시지
 */
export async function onMessageUpdate(client: Client, before: Message, after: Message) {
  if (isByThisBot(client, after)) {
    return;
  }

  if (isFromDm(after)) {
    return;
  }

  if (isPinned(after) || (await isArchived(after))) {
    log(
      `📝 메시지를 새로 아카이브하거나 기존 아카이브를 업데이트합니다: ${stringifyMessage(after)}`
    );

    await new PinMessageUpdateResponder(after).handle();
  }
}
