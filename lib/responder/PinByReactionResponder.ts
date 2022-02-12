import Responder from "./Responder";
import { MessageReaction } from "discord.js";
import PinService from "../service/PinService";

export default class PinByReactionResponder implements Responder {
  constructor(private readonly reaction: MessageReaction) {
  }

  public async handle() {
    await new PinService(this.reaction).handleReaction();
  }
}
