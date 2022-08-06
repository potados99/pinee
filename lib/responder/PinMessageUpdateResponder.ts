import { log } from "../utils/logging";
import { Message } from "discord.js";
import Responder from "./Responder";
import ArchiveService from "../service/ArchiveService";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";

/**
 * 메시지가 변경되었을 때에 반응하는 responder입니다.
 */
export default class PinMessageUpdateResponder implements Responder {
  constructor(private readonly message: Message) {
  }

  public async handle() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.message).execute();
    if (archiveChannel == null) {
      log("아카이브 채널이 없어요!");
      return;
    }

    const archiveService = new ArchiveService(archiveChannel);
    const existingArchive = await archiveService.getArchive(this.message);

    if (existingArchive != null) {
      await archiveService.updateArchive(existingArchive, this.message);
    } else {
      await archiveService.createArchive(this.message);
    }
  }
}
