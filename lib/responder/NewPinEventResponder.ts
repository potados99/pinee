import { Client, Message } from "discord.js";
import config from "../../config";
import AskUserBoolean from "../interactor/AskUserBoolean";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";
import { isFromNonPublicChannel, isFromNsfwChannel } from "../utils/message";
import archiveRepo from "../repository/ArchiveRepository";
import Responder from "./Responder";

export default class NewPinEventResponder implements Responder {
  constructor(
    private readonly client: Client,
    private readonly message: Message
  ) {
  }

  public async handle() {
    if (isFromNonPublicChannel(this.message) || isFromNsfwChannel(this.message)) {
      const ok = await this.askIfUserWantsToPublishThis();
      if (!ok) {
        return;
      }
    }

    await this.archiveMessage();
  }

  async askIfUserWantsToPublishThis() {
    return new AskUserBoolean(this.message).execute({
      title: "오이오이 위험하다구!",
      description: "이 메시지를 고정하면 모든 사용자가 볼 수 있습니다. 계속할까요?",
      color: config.bot.themeColor
    });
  }

  async archiveMessage() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.message).execute();

    if (!archiveChannel) {
      console.log("Cannot save new archive: no archive channel! :(");
      return;
    }

    await archiveRepo.createArchiveToChannel(this.message, archiveChannel);
  }
}
