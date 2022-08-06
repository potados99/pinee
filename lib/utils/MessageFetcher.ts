import { log } from "./logging";
import config from "../../config";
import { getChannelName } from "./channel";
import { ChannelLogsQueryOptions, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";

type FetchRequestCallback = (
  numberOfFetchedMessages: number,
  accumulatedRequestCount: number,
  lastFetchedMessageId?: string
) => void;

export default class MessageFetcher {
  constructor(private readonly channel: TextChannel | NewsChannel | DMChannel) {
  }

  async fetch(
    onEveryRequest?: FetchRequestCallback,
    until?: string
  ): Promise<Message[]> {
    const out: Message[] = [];

    const onMessage = (message: Message) => {
      out.push(message);
    };

    await this.forEachMessages(
      onMessage,
      onEveryRequest,
      until
    );

    log(`'${getChannelName(this.channel)}' 채널에서 메시지를 총 ${out.length}개 가져왔습니다.`);

    return out;
  }

  /**
   * 최신부터 과거까지 순차적으로 fetch합니다.
   * until이 주어지지 않으면 가장 처음 메시지까지 가져옵니다.
   * until이 주어지면 현재부터 해당 메시지까지만 가져옵니다.
   *
   * @param onMessage
   * @param onEveryRequest
   * @param until
   * @private
   */
  private async forEachMessages(
    onMessage: (message: Message) => void,
    onEveryRequest?: FetchRequestCallback,
    until?: string
  ): Promise<void> {

    let lastId: string | undefined = undefined;
    let requestsSentCount = 0;

    while (true) {
      const options: ChannelLogsQueryOptions = {
        limit: config.services.discord.api.fetchLimitPerRequest,
        before: lastId
      };

      let messages;
      try {
        const fetched = await this.channel.messages.fetch(options, false, true);
        messages = fetched.array();
      } catch (e: any) {
        console.error(`예상치 못한 에러입니다: ${e.message}`);
        continue;
      }

      if (messages.length === 0) {
        break;
      }

      lastId = messages[messages.length - 1].id;

      log(`#${requestsSentCount}: '${getChannelName(this.channel)}' 채널에서 메시지를 ${messages.length}개 가져왔습니다.`);

      for (const message of messages) {
        await onMessage(message);
      }

      if (onEveryRequest != null) {
        await onEveryRequest(messages.length, ++requestsSentCount, lastId);
      }

      if (until != null && lastId < until) {
        break;
      }

      if (messages.length < config.services.discord.api.fetchLimitPerRequest) {
        break;
      }
    }
  }
}
