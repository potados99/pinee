import { Client, Message } from "discord.js";
import archiveRepo from "../repository/ArchiveRepository";

export default class PinMessageUpdateResponder {

  private readonly client: Client;
  private readonly message: Message;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
  }

  public async handle() {
    await archiveRepo.updateArchive(this.client, this.message);
  }
}
