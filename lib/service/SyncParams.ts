import { Message } from "discord.js";

export default class SyncParams {
  public targetMessages: Message[];
  public archivesToBeDeleted: Message[];
  public messagesToBeArchived: Message[];
}
