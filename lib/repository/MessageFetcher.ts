import config from '../../config';
import {error, log} from '../utils/logging';
import {getChannelName} from '../utils/channel';
import {ChannelLogsQueryOptions, DMChannel, Message, NewsChannel, TextChannel} from 'discord.js';

type FetchRequestCallback = (
  numberOfFetchedMessages: number,
  accumulatedRequestCount: number,
  lastFetchedMessageId?: string
) => void;

/**
 * 채널에서 메시지 정보를 원하는 만큼 꺼내오는 API 호출을 담당하는 객체입니다.
 * 여러 번의 fetch를 통해 Discord API의 호출 제약을 극복합니다.
 */
export default class MessageFetcher {
  constructor(private readonly channel: TextChannel | NewsChannel | DMChannel) {}

  /**
   * 최신부터 과거까지 순차적으로 메시지를 꺼내옵니다.
   * 한 번의 API 호출에 여러 개의 메시지를 가져오며, 매 호출마다 콜백을 실행합니다.
   * @param onEveryRequest API 호출마다 실행할 콜백
   * @param until 가져올 메시지의 과거 하한선이 되는 메시지의 식별자. 지정하지 않으면 최신 메시지부터 가장 과거 메시지까지 가져옵니다. 지정하면 최신 메시지부터 해당 메시지까지만 가져옵니다.
   */
  async fetch(onEveryRequest?: FetchRequestCallback, until?: string): Promise<Message[]> {
    const out: Message[] = [];

    const onMessage = (message: Message) => {
      out.push(message);
    };

    await this.fetchContinuously(onMessage, onEveryRequest, until);

    log(`'${getChannelName(this.channel)}' 채널에서 메시지를 총 ${out.length}개 가져왔습니다.`);

    return out;
  }

  private async fetchContinuously(
    onMessage: (message: Message) => void,
    onEveryRequest?: FetchRequestCallback,
    until?: string
  ): Promise<void> {
    let requestsSentCount = 0;
    let messages: Message[] = [];
    let lastId = undefined;

    while (true) {
      /**
       * Part 1.
       * API 호출합니다.
       */
      const options: ChannelLogsQueryOptions = {
        limit: config.services.discord.api.fetchLimitPerRequest,
        before: lastId,
      };

      try {
        const fetched = await this.channel.messages.fetch(options, false, true);
        requestsSentCount++;
        messages = fetched.array();
      } catch (e: any) {
        error(`예상치 못한 에러입니다: ${e.message}`);
        continue;
      }

      /**
       * Part 2.
       * 결과를 보고 해석합니다.
       */
      if (messages.length === 0) {
        break;
      }

      lastId = messages[messages.length - 1].id;

      log(
        `#${requestsSentCount}: '${getChannelName(this.channel)}' 채널에서 메시지를 ${
          messages.length
        }개 가져왔습니다.`
      );

      /**
       * Part 3.
       * 콜백을 호출합니다.
       */
      for (const message of messages) {
        await onMessage(message);
      }

      if (onEveryRequest != null) {
        await onEveryRequest(messages.length, requestsSentCount, lastId);
      }

      /**
       * Part 4.
       * 계속 해도 될 지 결정합니다.
       */
      if (until != null && lastId < until) {
        break;
      }

      if (messages.length < config.services.discord.api.fetchLimitPerRequest) {
        break;
      }
    }
  }
}
