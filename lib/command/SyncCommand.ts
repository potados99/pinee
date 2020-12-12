import Command from "./Command";
import { Client, Guild, Message } from "discord.js";
import AskUser from "../interactor/AskUser";
import config from "../../config";
import GetOrCreateArchiveChannel from "../interactor/GetOrCreateArchiveChannel";
import { isByOwner } from "../utils/message";
import messageRepo from "../repository/MessageRepository";
import TellUser from "../interactor/TellUser";
import archiveRepo from "../repository/ArchiveRepository";

class SyncOptions {
  public includeUnpinnedMessages: boolean = true;
  public deleteAndRewrite: boolean = false;
}

export default class SyncCommand extends Command {
  constructor(command: string) {
    super(command);
  }

  public async execute(client: Client, message: Message): Promise<void> {
    if (!isByOwner(message)) {
      return;
    }

    const keep = await new AskUser(client, message, true).execute({
      title: '고정메시지 가져오기',
      description: '모든 고정 메시지를 읽어서 오래된 메시지부터 아카이브합니다.' +
        '\n원본 메시지에는 영향이 없습니다.' +
        '\n' +
        '\n계속 하시겠습니까?' +
        '\n(실행 전 최종 확인 단계가 있습니다)',
      color: config.bot.themeColor
    });

    if (!keep) {
      return;
    }

    const options = new SyncOptions();

    options.includeUnpinnedMessages = await new AskUser(client, message, true).execute({
      title: '고정 해제된 메시지 포함 여부',
      description: '고정되었다가 해제된 메시지도 가져올까요?' +
        '\n삭제된 메시지는 가져오지 않습니다.',
      color: config.bot.themeColor
    });

    const dialog_checkingAlreadyArchived = await new TellUser(client, message).execute({
      title: '이미 백업된 고정메시지가 있는지 확인중입니다.',
      description: '잠시만 기다려 주세요 ㅎㅎ',
      color: config.bot.themeColor
    })

    const archived = await archiveRepo.getAllArchives(client, message.guild!!);
    await dialog_checkingAlreadyArchived.delete();

    const isNotFirstSync = archived.length > 0;
    if (isNotFirstSync) {
      options.deleteAndRewrite = await new AskUser(client, message, true).execute({
        title: '이미 백업된 메시지 처리',
        description: `이미 백업된 메시지가 ${archived.length}개 있습니다. 어떻게 할까요?` +
          '\n✅: 기존의 백업을 지우고 새로 백업합니다(추천).' +
          '\n❌: 기존에 백업되지 않은 부분만 추가합니다.',
        color: config.bot.themeColor
      });
    }

    const dialog_doingSomething = await new TellUser(client, message).execute({
      title: '준비중입니다',
      description: '조금 오래 걸릴 수 있습니다. 잠시만 기다려 주세요 ㅎㅎ',
      color: config.bot.themeColor
    })

    const previewMessage = await this.getPreviewMessage(client, message.guild!!, options);
    await dialog_doingSomething.delete();

    const finalConfirm = await new AskUser(client, message).execute({
      title: '최종 확인',
      description: previewMessage,
      color: config.bot.themeColor
    })

    if (!finalConfirm) {
      return;
    }

    await this.sync(client, message, options);
  }

  private async getPreviewMessage(client: Client, guild: Guild, options: SyncOptions) {
    const targetMessages = options.includeUnpinnedMessages ?
      await messageRepo.getAllOncePinnedMessagesOfGuild(guild) :
      await messageRepo.getAllCurrentlyPinedMessagesOfGuild(guild);

    const existingArchived = await archiveRepo.getAllArchives(client, guild);

    const numberOfBackupTargets = targetMessages.length;
    const numberOfArchivesToDelete = options.deleteAndRewrite ?
      existingArchived.length :
      0;
    const numberOfArchivedToAdd = options.deleteAndRewrite ?
      targetMessages.length :
      Math.min(targetMessages.length - existingArchived.length, 0);

    return '**백업 옵션**' +
      `\n고정 해제된 메시지 포함: ${options.includeUnpinnedMessages}` +
      `\n백업 덮어쓰기: ${options.deleteAndRewrite}` +
      '\n' +
      '\n**변경 예정**' +
      `\n백업 대상 메시지: ${numberOfBackupTargets}개` +
      `\n삭제할 아카이브: ${numberOfArchivesToDelete}개` +
      `\n추가할 아카이브: ${numberOfArchivedToAdd}개` +
      '\n' +
      '\n**원본에는 영향이 없습니다.**' +
      '\n계속 하시겠습니까?';
  }


  private async sync(client: Client, message: Message, options: SyncOptions) {
    console.log(options);
    const targetMessages = options.includeUnpinnedMessages ?
      await messageRepo.getAllOncePinnedMessagesOfGuild(message.guild!!) :
      await messageRepo.getAllCurrentlyPinedMessagesOfGuild(message.guild!!);

    console.log(targetMessages.map(m => m.content));
  }


/*
  private static async performSync(client: Client, message: Message) {
    const archiveChannel = await new GetOrCreateArchiveChannel(client, message).execute();
    if (!archiveChannel) {
      console.log('No archive channel! :(');
      await message.reply('아카이브 채널이 없어 백업을 수행할 수 없습니다 ㅠ')
      return;
    }

    const allPins = await messageRepo.getAllCurrentlyPinedMessagesOfGuild(message.guild!!, false);
    const progressMessage = await message.reply(`백업 중... 0/${allPins.length}`);

    for (let i = 0; i < allPins.length; i++) {
      await progressMessage.edit(`백업 중... ${i+1}/${allPins.length}`);

      const pin = allPins[i];
      await new ArchiveMessage(client, pin).execute(archiveChannel);
    }

    await progressMessage.edit(`${allPins.length}개의 고정 메시지를 '${archiveChannel.name}' 채널로 복사하였습니다.`);
  }
  */
}
