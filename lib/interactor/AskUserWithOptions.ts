import { Client, Message, MessageEmbedOptions, MessageReaction, User } from "discord.js";
import TellUser from "./TellUser";
import { isOwner } from "../utils/user";
import AskOptions from "./AskOptions";

export default class AskUserWithOptions {
  constructor(
    private readonly client: Client,
    private readonly message: Message,
    private readonly options: AskOptions
  ) {
  }

  public async execute(messageData: MessageEmbedOptions) {
    const dialogSent = await this.ask(messageData);

    return await this.waitForReply(dialogSent);
  }

  private async ask(messageData: MessageEmbedOptions) {
    const confirmDialogSent = await new TellUser(this.client, this.message).execute(messageData);

    // Attach reaction, letting user select one of the options.
    for (const option of this.options.choices!!) {
      await confirmDialogSent.react(option);
    }

    return confirmDialogSent;
  }

  private async waitForReply(dialogSent: Message) {
    const confirmReactionFilter = (reaction: MessageReaction, user: User) => {
      const oneOfAvailableOptions = this.options.choices!!.includes(reaction.emoji.name);
      const notByThisBot = user.id !== this.client.user?.id;
      const byPermittedUser = !this.options.onlyForOwner || (isOwner(user, dialogSent.guild!!));

      return oneOfAvailableOptions && notByThisBot && byPermittedUser;
    };

    // Wait until first reaction or timeout.
    const awaitOptions = { max: 1, time: this.options.replyTimeout };

    // Wait for user's answer
    const usersAnswer = await dialogSent.awaitReactions(confirmReactionFilter, awaitOptions);
    const firstAnswer = usersAnswer.first();

    // Confirmation finished.
    await dialogSent.delete();

    return firstAnswer?.emoji.name;
  }
}
