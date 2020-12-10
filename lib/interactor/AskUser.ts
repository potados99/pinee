import Discord, { Client, Message, MessageEmbedOptions, MessageReaction, User } from "discord.js";
import config from "../../config";

export default class AskUser {

  private client: Client;
  private message: Message;

  private confirmOptions = ['✅', '❌'];

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
  }

  public async execute(messageData: MessageEmbedOptions) {
    const dialogSent = await this.ask(messageData);
    const reply = await this.waitForReply(dialogSent);

    return !!reply && reply === '✅';
  }

  private async ask(messageData: MessageEmbedOptions) {
    // What to ask
    const confirmDialogMessage = new Discord.MessageEmbed(messageData);

    // Send a confirm message.
    const confirmDialogSent = await this.message.reply(confirmDialogMessage);

    // Attach reaction, letting user select one of the options.
    for (const option of this.confirmOptions) {
      await confirmDialogSent.react(option);
    }

    return confirmDialogSent;
  }

  private async waitForReply(dialogSent: Message) {
    // A reaction shall be one of the confirmOptions and shall not be from this bot.
    const confirmReactionFilter = (reaction: MessageReaction, user: User) => {
      const oneOfAvailableOptions = this.confirmOptions.includes(reaction.emoji.name);
      const notByThisBot = user.id !== this.client.user?.id;

      return oneOfAvailableOptions && notByThisBot;
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
