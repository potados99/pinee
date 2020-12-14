import Command from "./Command";
import { Client, Message } from "discord.js";
import AskUserBoolean from "../interactor/AskUserBoolean";
import config from "../../config";
import { isByOwner } from "../utils/message";
import TellUser from "../interactor/TellUser";
import archiveRepo from "../repository/ArchiveRepository";
import SyncOptions from "../service/SyncOptions";
import SyncService from "../service/SyncService";
import SyncParams from "../service/SyncParams";
import channelRepo from "../repository/ChannelRepository";

export default class SyncCommand extends Command {

  constructor(command: string) {
    super(command);
  }

  public async execute(client: Client, message: Message): Promise<void> {
    if (!isByOwner(message)) {
      return;
    }

    const options = await this.askOptions(client, message);
    if (!options) {
      return;
    }

    const syncService = new SyncService(client, message);

    const dialog_doingSomething = await new TellUser(client, message).execute({
      title: "준비중입니다",
      description: "조금 오래 걸릴 수 있습니다. 잠시만 기다려 주세요 ㅎㅎ",
      color: config.bot.themeColor
    });

    const preSyncResult = await syncService.preSync(options);
    const previewMessage = await this.getPreviewMessage(options, preSyncResult);

    await dialog_doingSomething.delete();

    /**
     * Ask confirm or not.
     */
    const finalConfirm = await new AskUserBoolean(client, message, true).execute({
      title: "이대로 진행할까요?",
      description: previewMessage,
      color: config.bot.themeColor
    });
    if (!finalConfirm) {
      return;
    }

    await syncService.sync(preSyncResult);
  }

  private async askOptions(client: Client, message: Message) {
    const options = new SyncOptions();

    /**
     * Ask start or not
     */
    const keep = await new AskUserBoolean(client, message, true).execute({
      title: "메시지 아카이브",
      description: "모든 고정 메시지를 읽어서 오래된 메시지부터 아카이브합니다." +
        "\n원본 메시지에는 영향이 없습니다." +
        "\n" +
        "\n계속 하시겠습니까?" +
        "\n(실행 전 최종 확인 단계가 있습니다)",
      color: config.bot.themeColor
    });
    if (!keep) {
      return null;
    }

    /**
     * Ask include private messages or not.
     */
    options.includeNonPublicMessages = await new AskUserBoolean(client, message, true).execute({
      title: "비공개 혹은 NSFW 채널의 메시지",
      description: "비공개 혹은 NSFW 채널의 메시지도 가져올까요?",
      color: config.bot.themeColor
    })

    /**
     * Ask include unpinned messages or not.
     */
    options.includeUnpinnedMessages = await new AskUserBoolean(client, message, true).execute({
      title: "고정 해제된 메시지",
      description: "고정되었다가 해제된 메시지도 가져올까요?" +
        "\n삭제된 메시지는 가져오지 않습니다." +
        "\n" +
        "\n> 이 옵션을 사용하면 현재 고정된 메시지 대신 시스템이 남긴 메시지 고정 기록을 참고하여 메시지를 가져옵니다.",
      color: config.bot.themeColor
    });

    /**
     * Ask rewrite behavior if archives exist.
     */
    const { archiveChannel, existingArchives } = await this.checkForExistingArchives(client, message);
    if (existingArchives.length > 0) {
      options.deleteAndRewrite = await new AskUserBoolean(client, message, true).execute({
        title: "기존 아카이브 처리",
        description: `${archiveChannel} 채널에 보관된 메시지가 ${existingArchives.length}개 있습니다. 어떻게 할까요?` +
          "\n" +
          "\n✅: 기존 아카이브는 모두 지우고 새로 아카이브합니다(추천)." +
          "\n❌: 기존에 아카이브되지 않은 부분만 추가합니다.",
        color: config.bot.themeColor
      });
    }

    return options;
  }

  private async checkForExistingArchives(client: Client, message: Message) {
    const dialog_checkingAlreadyArchived = await new TellUser(client, message).execute({
      title: "이미 백업된 고정메시지가 있는지 확인중입니다.",
      description: "잠시만 기다려 주세요 ㅎㅎ",
      color: config.bot.themeColor
    });
    const progress = await message.reply('아카이브를 가져옵니다.');

    const archiveChannel = channelRepo.getArchiveChannel(message.guild!!);
    const existingArchives = await archiveRepo.getAllArchivesFromChannel(client, archiveChannel, progress);

    await progress.delete();
    await dialog_checkingAlreadyArchived.delete();

    return {
      archiveChannel,
      existingArchives
    };
  }

  private async getPreviewMessage(options: SyncOptions, preSyncResult: SyncParams) {
    const numberOfBackupTargets = preSyncResult.targetMessages.length;
    const numberOfArchivesToDelete = preSyncResult.archivesToBeDeleted.length;
    const numberOfArchivedToAdd = preSyncResult.messagesToBeArchived.length;

    return "**백업 옵션**" +
      `\n- 고정 해제된 메시지 포함: ${options.includeUnpinnedMessages ? '웅' : '아니'}` +
      `\n- 백업 덮어쓰기: ${options.deleteAndRewrite ? '웅' : '아니'}` +
      "\n" +
      "\n**변경 예정**" +
      `\n- 백업 대상 메시지: ${numberOfBackupTargets}개` +
      `\n- 삭제할 아카이브: ${numberOfArchivesToDelete}개` +
      `\n- 추가할 아카이브: ${numberOfArchivedToAdd}개` +
      "\n" +
      "\n**원본에는 영향이 없습니다.**" +
      "\n계속 하시겠습니까?";
  }
}
