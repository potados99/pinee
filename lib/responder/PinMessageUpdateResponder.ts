import { Client, Message } from "discord.js";
import archiveRepo from "../repository/ArchiveRepository";
import Responder from "./Responder";

export default class PinMessageUpdateResponder implements Responder {
  constructor(
    private readonly client: Client,
    private readonly message: Message
  ) {
  }

  public async handle() {
    await archiveRepo.updateArchive(this.client, this.message);
  }
}
