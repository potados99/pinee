import { Client, Message, MessageEmbed, MessageReaction, PartialMessage } from "discord.js";

/**
 * 주어진 메시지가 길드 없이 온 DM인지 여부를 가져옵니다.
 * @param message 메시지
 */
export function isFromDm(message: Message | PartialMessage) {
  return !message.guild;
}

/**
 * 주어진 메시지가 이 봇이 보낸 메시지인지 여부를 가져옵니다.
 * @param client 클라이언트(이 봇)
 * @param message 메시지
 */
export function isByThisBot(client: Client, message: Message): Boolean {
  return message.author.id === client.user?.id;
}

/**
 * 주어진 메시지가 이 봇을 언급(mention)하고 있는지 여부를 가져옵니다.
 * @param client 클라이언트(이 봇)
 * @param message 메시지
 */
export function isMentioningThisBot(client: Client, message: Message): Boolean {
  const mentionedUsers = message.mentions.users.array();

  return mentionedUsers.find(user => user.id === client.user?.id) != null;
}

/**
 * 해당 메시지가 고정되었는 여부를 가져옵니다.
 * @param message 메시지
 */
export function isPinned(message: Message) {
  return message.pinned;
}

/**
 * 인자로 들어온 모든 메시지들에 대해 fetch가 완료된 버전을 반환합니다.
 * @param messages fetch가 필요할 수도 있는 메시지들
 */
export async function messagesFetched(...messages: (Message | PartialMessage)[]): Promise<Message[]> {
  return Promise.all(messages.map(m => m.partial ? m.fetch() : m));
}

/**
 * 인자로 들어온 모든 리액션들에 대해 fetch가 완료된 버전을 반환합니다.
 * @param reactions fetch가 필요할 수도 있는 리액션들
 */
export async function reactionsFetched(...reactions: (MessageReaction)[]): Promise<MessageReaction[]> {
  return Promise.all(reactions.map(r => r.partial ? r.fetch() : r));
}

/**
 * 메시지 속에서 첫 번째 embed를 꺼내 옵니다.
 * @param message 메시지
 */
export function extractEmbed(message: Message): MessageEmbed | undefined {
  const noEmbeds = message.embeds.length === 0;
  if (noEmbeds) {
    return undefined;
  }

  return message.embeds[0];
}

/**
 * 메시지를 스트링 형태로 나타냅니다.
 * 로그에 메시지를 출력할 때에 좋습니다.
 * @param message 메시지
 */
export function stringifyMessage(message: Message): string {
  return `'${message.author.username}'님이 보낸 메시지(내용은 '${message.cleanContent}', reference는 '${message.reference}')`;
}
