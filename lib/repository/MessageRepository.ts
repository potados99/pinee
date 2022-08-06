import {error} from '../utils/logging';
import MessageFetcher from './MessageFetcher';
import {isMessageChannel} from '../utils/channel';
import {Channel, DMChannel, Message, NewsChannel, TextChannel} from 'discord.js';

/**
 * 메시지 정보를 제공하는 저장소입니다.
 */
class MessageRepository {
  /**
   * 채널 내의 특정 메시지를 가져옵니다.
   * @param channel 메시지를 포함하는 채널
   * @param messageId 특정 메시지의 식별자
   */
  async getMessageFromChannel(channel: Channel, messageId: string) {
    if (!isMessageChannel(channel)) {
      return undefined;
    }

    // @ts-ignore
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return MessageRepository.getMessageSafely(messageChannel, messageId);
  }

  private static async getMessageSafely(
    channel: TextChannel | NewsChannel | DMChannel,
    messageId: string
  ): Promise<Message | undefined> {
    try {
      // 찾고자 하는 메시지가 삭제된 메시지인 경우, API 호출이 예외를 던집니다.
      return await channel.messages.fetch(messageId);
    } catch (e: any) {
      error(
        `Discord API 호출 중 예외가 발생하였기 때문에 메시지 '${messageId}'를 가져올 수 없습니다: ${e.message}`
      );
      return undefined;
    }
  }

  /**
   * 채널 내의 모든 메시지를 가져옵니다.
   * @param channel 메시지를 가져올 채널
   * @param until 가장 최신 메시지부터 이 메시지까지 가져옵니다.
   * @param progress 진행 상황을 알려줄 다이얼로그 메시지
   */
  async getAllMessagesFromChannel(channel: Channel, until?: string, progress?: Message) {
    if (!isMessageChannel(channel)) {
      return [];
    }

    // @ts-ignore
    const messageChannel: TextChannel | NewsChannel | DMChannel = channel;

    return await this.fetchMessages(messageChannel, until, progress);
  }

  private async fetchMessages(
    channel: TextChannel | NewsChannel | DMChannel,
    until?: string,
    progress?: Message
  ): Promise<Message[]> {
    return await new MessageFetcher(channel).fetch(
      async (numberOfFetchedMessages, accumulatedRequestCount) => {
        await progress?.edit(
          `${channel} 채널에서 ${accumulatedRequestCount}번째 요청으로 ${numberOfFetchedMessages}개의 메시지를 가져왔습니다.`
        );
      },
      until
    );
  }
}

export default new MessageRepository();
