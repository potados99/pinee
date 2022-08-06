import Responder from "./Responder";
import PinService from "../service/PinService";
import { MessageReaction } from "discord.js";

/**
 * 같은 메시지에서 여러 차례 발생한 pin 리액션에 반응하는 responder입니다.
 */
export default class PinByReactionResponder implements Responder {
  constructor(private readonly reaction: MessageReaction) {
  }

  public async handle() {
    await new PinService(this.reaction).handleReaction();
  }
}
