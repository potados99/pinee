import {info} from '../utils/logging';
import DmResponder from '../responder/DmResponder';
import MentionResponder from '../responder/MentionResponder';
import {Client, Message} from 'discord.js';
import {isByThisBot, isFromDm, isMentioningThisBot, isPinned, stringifyMessage} from '../utils/message';
import {isArchived} from '../utils/archive';
import PinMessageUpdateResponder from '../responder/PinMessageUpdateResponder';

/**
 * 새 메시지가 도착했을 때에 실행할 동작을 정의합니다.
 * @param client 클라이언트
 * @param message 새 메시지
 */
export async function onMessageCreate(client: Client, message: Message) {
  if (isByThisBot(client, message)) {
    return;
  }

  if (isFromDm(message)) {
    info(`💌 새 DM이 도착하였습니다: ${stringifyMessage(message)}`);

    await new DmResponder(message).handle();
    return;
  }

  if (isMentioningThisBot(client, message)) {
    info(`📨 새 Mention 메시지가 도착하였습니다: ${stringifyMessage(message)}`);

    await new MentionResponder(message).handle();
    return;
  }
}

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

  if (!isPinned(after)) {
    /**
     * !현재! 고정된 메시지에 대해서만 아카이브를 관리합니다.
     * 즉, 고정 해제된 메시지는 아카이브에 대해 영향을 미치지 못합니다.
     */
    return;
  }

  info(`📝 메시지를 새로 아카이브하거나 기존 아카이브를 업데이트합니다: ${stringifyMessage(after)}`);

  await new PinMessageUpdateResponder(after).handle();
}
