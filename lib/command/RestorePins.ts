import Command from "./Command";
import { Client, Message } from "discord.js";
import messageRepo from "../repository/MessageRepository";

export default class RestorePins extends Command {
  constructor(command: string) {
    super(command);
  }

  async execute(client: Client, message: Message): Promise<void> {
    const allOncePinnedMessages = await messageRepo.getAllOncePinnedMessagesOfGuild(message.guild!!);

    for (const msg of allOncePinnedMessages) {
      console.log(msg.content);
    }
  }
}
