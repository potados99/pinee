import {info} from '../utils/logging';
import {MessageReaction} from 'discord.js';
import config from '../../config';
import PinByReactionResponder from '../responder/PinByReactionResponder';
import {stringifyMessage} from '../utils/message';

/**
 * 새로운 리액션이 추가되었을 때에 실행할 동작을 정의합니다.
 * @param reaction 새로운 리액션
 */
export async function onReactionAdd(reaction: MessageReaction) {
  const reactionEmoji = reaction.emoji.name!!;
  const reactionCount = reaction.count || 0;

  const thisIsThePin = reactionEmoji in config.behaviors.pinByReaction.availablePins;
  const atExactThreshold = reactionCount === config.behaviors.pinByReaction.pinCountThreshold;

  if (!thisIsThePin) {
    return;
  }

  if (!atExactThreshold) {
    return;
  }

  info(`📌 핀으로 메시지를 고정합니다: ${stringifyMessage(reaction.message)}`);

  await new PinByReactionResponder(reaction).handle();
}
