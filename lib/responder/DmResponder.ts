import Responder from "./Responder";
import { Message } from "discord.js";
import DmService from "../service/DmService";

export default class DmResponder implements Responder {
  constructor(private readonly message: Message) {
  }

  async handle() {
    const answer = await new DmService(this.message).getAnswer();

    await this.message.reply(answer);
  }
}
