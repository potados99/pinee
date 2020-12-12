import Discord, { Client, Message, MessageEmbedOptions, MessageReaction, User } from "discord.js";
import config from "../../config";
import TellUser from "./TellUser";

export default class AskUser {

  private readonly client: Client;
  private readonly message: Message;
  private readonly onlyAllowAnswerFromOwner: boolean;

  private confirmOptions = ['✅', '❌'];

  constructor(client: Client, message: Message, onlyAllowAnswerFromOwner: boolean = false) {
    this.client = client;
    this.message = message;
    this.onlyAllowAnswerFromOwner = onlyAllowAnswerFromOwner;
  }

  public async execute(messageData: MessageEmbedOptions) {
    const dialogSent = await this.ask(messageData);
    const reply = await this.waitForReply(dialogSent);

    return !!reply && reply === '✅';
  }

  private async ask(messageData: MessageEmbedOptions) {
    const confirmDialogSent = await new TellUser(this.client, this.message).execute(messageData);

    // Attach reaction, letting user select one of the options.
    for (const option of this.confirmOptions) {
      await confirmDialogSent.react(option);
    }

    return confirmDialogSent;
  }

  private async waitForReply(dialogSent: Message) {
    const confirmReactionFilter = (reaction: MessageReaction, user: User) => {
      const oneOfAvailableOptions = this.confirmOptions.includes(reaction.emoji.name);
      const notByThisBot = user.id !== this.client.user?.id;
      const byPermittedUser = !this.onlyAllowAnswerFromOwner || (user.id === dialogSent.guild!!.ownerID);

      return oneOfAvailableOptions && notByThisBot && byPermittedUser;
    };

    // Wait until first reaction or timeout.
    const awaitOptions = { max: 1, time: config.confirmDialog.timeout };

    // Wait for user's answer
    const usersAnswer = await dialogSent.awaitReactions(confirmReactionFilter, awaitOptions);
    const firstAnswer = usersAnswer.first();

    // Confirmation finished.
    await dialogSent.delete();

    return firstAnswer?.emoji.name;
  }
}
