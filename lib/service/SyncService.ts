import { Client, Guild, Message } from "discord.js";
import messageRepo from "../repository/MessageRepository";
import archiveRepo from "../repository/ArchiveRepository";
import SyncOptions from "./SyncOptions";
import SyncParams from "./SyncParams";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";

export default class SyncService {

  private readonly client: Client;
  private readonly message: Message;
  private readonly guild: Guild;

  constructor(client: Client, message: Message) {
    this.client = client;
    this.message = message;
    this.guild = message.guild!!;
  }

  public async preSync(options: SyncOptions) {
    const targetMessages = options.includeUnpinnedMessages ?
      await messageRepo.getAllOncePinnedMessagesOfGuild(this.guild) :
      await messageRepo.getAllCurrentlyPinedMessagesOfGuild(this.guild);

    const existingArchives = await archiveRepo.getAllArchives(this.client, this.guild);
    const archivedMessageIds = await archiveRepo.getAllArchivedMessageIds(this.client, this.guild);

    const archivesToBeDeleted = options.deleteAndRewrite ? existingArchives : [];
    const messagesToBeArchived = options.deleteAndRewrite ? targetMessages : targetMessages.filter((message) => !archivedMessageIds.includes(message.id));

    const result = new SyncParams();
    result.targetMessages = targetMessages;
    result.archivesToBeDeleted = archivesToBeDeleted;
    result.messagesToBeArchived = messagesToBeArchived;

    return result;
  }

  public async sync(params: SyncParams) {
    const channel = await new GetOrCreateArchiveChannel(this.client, this.message).execute();
    if (!channel) {
      await this.message.reply('아카이브 채널이 없어 백업을 시작할 수 없습니다 ㅠ');
      return;
    }

    const alert = await this.message.reply(SyncService.composeProgress('백업을 시작합니다.'));

    for (const [i, archive] of params.archivesToBeDeleted.entries()) {
      await alert.edit(SyncService.composeProgress('기존 백업을 삭제합니다', i, params.archivesToBeDeleted.length));
      await archive.delete();
    }

    for (const [i, message] of params.messagesToBeArchived.entries()) {
      await alert.edit(SyncService.composeProgress('메시지를 아카이브합니다', i, params.messagesToBeArchived.length));
      await archiveRepo.archiveMessageToChannel(message, channel);
    }

    await alert.edit(`${params.messagesToBeArchived.length}개의 메시지를 ${channel.name} 채널로 복사했습니다.`);
  }

  private static composeProgress(body: string, current?: number, all?: number) {
    return body + ((current !== undefined && all !== undefined) ? `...${current}/${all}` : '');
  }
}
