import { Client, Message, MessageEmbedOptions } from "discord.js";
import config from "../../config";
import AskUserWithOptions from "./AskUserWithOptions";
import AskOptions from "./AskOptions";

export default class AskUserBoolean {
  private readonly options: AskOptions = {
    choices: ["✅", "❌"],
    onlyForOwner: this.onlyForOwner,
    replyTimeout: config.confirmDialog.timeout
  };

  constructor(
    private readonly client: Client,
    private readonly message: Message,
    private readonly onlyForOwner: boolean = false
  ) {
  }

  public async execute(messageData: MessageEmbedOptions) {
    const reply = await new AskUserWithOptions(this.client, this.message, this.options).execute(messageData);

    return !!reply && reply === "✅";
  }
}
