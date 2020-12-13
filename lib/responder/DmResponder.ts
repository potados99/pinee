import Responder from "./Responder";
import { Client, Message } from "discord.js";

export default class DmResponder implements Responder {

  private readonly client: Client;
  private readonly message: Message;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
  }

  async handle() {
    await this.message.reply(`안녕하세요! pinee입니다!`);
  }
}
