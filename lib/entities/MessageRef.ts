export default class MessageRef {

  public readonly guildId: string;
  public readonly channelId: string;
  public readonly messageId: string;

  constructor(guildId: string, channelId: string, messageId: string) {
    this.guildId = guildId;
    this.channelId = channelId;
    this.messageId = messageId;
  }
}
