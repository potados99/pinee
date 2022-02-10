import { Message } from "discord.js";
import Responder from "./Responder";
import SyncArchive from "../interactor/SyncArchive";

export default class PinMessageUpdateResponder implements Responder {
  constructor(private readonly message: Message) {
  }

  public async handle() {
    await new SyncArchive(this.message).execute();
  }
}
