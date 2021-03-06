import { Client, Guild, Message } from "discord.js";
import config from "../../config";
import AskUserBoolean from "../interactor/AskUserBoolean";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";
import { isFromNonPublicChannel, isFromNsfwChannel } from "../utils/message";
import archiveRepo from "../repository/ArchiveRepository";
import Responder from "./Responder";

export default class NewPinEventResponder implements Responder {

  private readonly client: Client;
  private readonly message: Message;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!;
  }

  public async handle() {
    if (isFromNonPublicChannel(this.message) || isFromNsfwChannel(this.message)) {
      if (!await this.askIfUserWantsToPublishThis()) {
        return;
      }
    }

    await this.archiveMessage();
  }

  async askIfUserWantsToPublishThis() {
    return new AskUserBoolean(this.client, this.message).execute({
      title: "오이오이 위험하다구!",
      description: "이 메시지를 고정하면 모든 사용자가 볼 수 있습니다. 계속할까요?",
      color: config.bot.themeColor
    });
  }

  async archiveMessage() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.client, this.message).execute();

    if (!archiveChannel) {
      console.log("Cannot save new archive: no archive channel! :(");
      return;
    }

    await archiveRepo.archiveMessageToChannel(this.message, archiveChannel);
  }
}
