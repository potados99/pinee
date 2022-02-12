import Responder from "./Responder";
import { Message } from "discord.js";
import SimSimService from "../service/SimSimService";

export default class MentionResponder implements Responder {
  constructor(private readonly message: Message) {
  }

  async handle() {
    const answer = await new SimSimService(this.message).getAnswer();

    await this.message.reply(answer);
  }
}
