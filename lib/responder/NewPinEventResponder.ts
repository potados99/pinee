import { Client, Guild, Message, PermissionOverwrites } from "discord.js";
import config from "../../config";
import AskUser from "../interactor/AskUser";
import ArchiveMessage from "../interactor/ArchiveMessage";
import GetArchiveChannel from "../interactor/GetArchiveChannel";

export default class NewPinEventResponder {

  private readonly client: Client;
  private readonly message: Message;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!; /* Cannot be null */
  }

  public async handle() {
    // Ask if this message is from private channel.
    if (this.isMessageFromNonPublicChannel() && !await this.askIfUserWantsToPublishThis()) {
      return;
    }

    // Perform archive
    await this.archiveMessage();
  }

  isMessageFromNonPublicChannel() {
    // @ts-ignore
    const channelPermissionsOverwrites: Map<string, PermissionOverwrites> = this.message.channel.permissionOverwrites;

    for (const overwrite of channelPermissionsOverwrites.values()) {
      const isAboutRole = overwrite.type === "role";
      const isAboutMember = overwrite.type === "member";
      const readDenied = overwrite.deny.bitfield & 1024;

      if (isAboutRole && readDenied) {
        console.log("This is a non-public channel for >= 1 role(s).");
        return true;
      }

      if (isAboutMember && readDenied) {
        console.log("This is a non-public channel for >= 1 member(s).");
        return true;
      }
    }

    return false;
  }

  async askIfUserWantsToPublishThis() {
    return new AskUser(this.client, this.message).execute({
      title: "오이오이 위험하다구!",
      description: "이 메시지를 고정하면 모든 사용자가 볼 수 있습니다. 계속할까요?",
      color: config.bot.themeColor
    });
  }

  async archiveMessage() {
    const archiveChannel = await new GetArchiveChannel(this.client, this.message).execute();

    if (!archiveChannel) {
      console.log('No archive channel! :(');
    }

    await new ArchiveMessage(this.client, this.message).execute(archiveChannel);
  }
}
