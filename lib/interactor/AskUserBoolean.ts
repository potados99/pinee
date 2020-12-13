import { Client, Message, MessageEmbedOptions } from "discord.js";
import config from "../../config";
import AskUserWithOptions from "./AskUserWithOptions";
import AskOptions from "./AskOptions";

export default class AskUserBoolean {

  private readonly client: Client;
  private readonly message: Message;
  private readonly options: AskOptions;

  constructor(client: Client, message: Message, onlyForOwner: boolean = false) {
    this.client = client;
    this.message = message;
    this.options = {
      choices: ["✅", "❌"],
      onlyForOwner,
      replyTimeout: config.confirmDialog.timeout
    };
  }

  public async execute(messageData: MessageEmbedOptions) {
    const reply = await new AskUserWithOptions(this.client, this.message, this.options).execute(messageData);

    return !!reply && reply === "✅";
  }
}
