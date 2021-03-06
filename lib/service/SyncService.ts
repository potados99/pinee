import { Client, Guild, Message } from "discord.js";
import messageRepo from "../repository/MessageRepository";
import archiveRepo from "../repository/ArchiveRepository";
import SyncOptions from "./SyncOptions";
import SyncParams from "./SyncParams";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";
import syncRepo from "../repository/SyncRepository";
import fetchSessionRepo from "../repository/FetchSessionRepository";

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
    const progress = await this.message.reply('동기화할 메시지를 가져옵니다.');

    const targetMessages = await this.getTargetMessages(progress, options);

    await progress.edit('기존 아카이브를 가져옵니다.');

    const existingArchives = await archiveRepo.getAllArchives(this.client, this.guild, progress);
    const archivedMessageIds = await archiveRepo.getAllArchivedMessageIds(this.client, this.guild);

    await progress.delete();

    const archivesToBeDeleted = options.deleteAndRewrite ? existingArchives : [];
    const messagesToBeArchived = options.deleteAndRewrite ? targetMessages : targetMessages.filter((message) => !archivedMessageIds.includes(message.id));

    const result = new SyncParams();
    result.targetMessages = targetMessages;
    result.archivesToBeDeleted = archivesToBeDeleted;
    result.messagesToBeArchived = messagesToBeArchived;

    return result;
  }

  private async getTargetMessages(progress: Message, options: SyncOptions) {
    return options.includeUnpinnedMessages ?
      await syncRepo.getAllOncePinnedMessagesInGuild(this.guild, progress, options.includeNonPublicMessages) :
      await syncRepo.getAllCurrentlyPinedMessagesInGuild(this.guild, progress, options.includeNonPublicMessages);
  }

  public async sync(params: SyncParams) {
    const channel = await new GetOrCreateArchiveChannel(this.client, this.message).execute();
    if (!channel) {
      console.warn('Aborting sync: no archive channel found.');
      await this.message.reply("아카이브 채널이 없어 백업을 시작할 수 없습니다 ㅠ");
      return;
    }

    console.log(`Sync: ${params.targetMessages.length} target messages. In channel '${channel.name}', ${params.archivesToBeDeleted.length} will be deleted, and ${params.messagesToBeArchived.length} will be archived.`);

    const alert = await this.message.reply(SyncService.composeProgress("백업을 시작합니다."));

    for (const [i, archive] of params.archivesToBeDeleted.entries()) {
      await alert.edit(SyncService.composeProgress("기존 백업을 삭제합니다", i + 1, params.archivesToBeDeleted.length));
      await archiveRepo.deleteArchive(archive);
    }

    for (const [i, message] of params.messagesToBeArchived.entries()) {
      await alert.edit(SyncService.composeProgress("메시지를 아카이브합니다", i + 1, params.messagesToBeArchived.length));
      await archiveRepo.archiveMessageToChannel(message, channel);
    }

    await alert.edit(`${params.messagesToBeArchived.length}개의 메시지를 ${channel} 채널로 복사했습니다.`);

    await this.clearFetchSession();
  }

  private async clearFetchSession() {
    await fetchSessionRepo.clear(this.guild.id);

    console.log('Fetch session cleared.');
  }

  private static composeProgress(body: string, current?: number, all?: number) {
    return body + ((current !== undefined && all !== undefined) ? `...${current}/${all}` : "");
  }
}
