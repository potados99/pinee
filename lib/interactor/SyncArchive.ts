import { Message } from "discord.js";
import GetOrCreateArchiveChannel from "./GetOrCreateArchiveChannel";
import ArchiveService from "../service/ArchiveService";

export default class SyncArchive {
  constructor(private readonly message: Message) {
  }

  public async execute() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.message).execute();
    if (archiveChannel == null) {
      console.log("아카이브 채널이 없어요!");
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
