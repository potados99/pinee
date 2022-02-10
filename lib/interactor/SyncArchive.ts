import { Message } from "discord.js";
import archiveRepo from "../repository/ArchiveRepository";
import GetOrCreateArchiveChannel from "./GetOrCreateArchiveChannel";

export default class SyncArchive {
  constructor(private readonly message: Message) {
  }

  public async execute() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.message).execute();
    if (archiveChannel == null) {
      console.log("Cannot save new archive: no archive channel! :(");
      return;
    }

    const existingArchive = await archiveRepo.getArchive(this.message);

    if (existingArchive != null) {
      await archiveRepo.updateArchive(existingArchive, this.message);
    } else {
      await archiveRepo.createArchive(this.message);
    }
  }
}
