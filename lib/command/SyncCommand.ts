import Command from "./Command";
import { Client, Message } from "discord.js";
import AskUser from "../interactor/AskUser";
import config from "../../config";
import GetArchiveChannel from "../interactor/GetArchiveChannel";
import ArchiveMessage from "../interactor/ArchiveMessage";
import { getAllPinsInThisGuild, isByOwner, isFromDm } from "../utils/message";

export default class SyncCommand extends Command {
  constructor(command: string) {
    super(command);
  }

  public async execute(client: Client, message: Message): Promise<void> {
    if (!isByOwner(message)) {
      return;
    }

    const keep = await new AskUser(client, message).execute({
      title: '고정메시지 백업',
      description: '모든 고정 메시지를 읽어서 오래된 메시지부터 아카이브합니다.\n원본 메시지에는 영향이 없습니다.\n계속 하시겠습니까?',
      color: config.bot.themeColor
    });

    if (!keep) {
      return;
    }

    await SyncCommand.performSync(client, message);
  }

  private static async performSync(client: Client, message: Message) {
    const archiveChannel = await new GetArchiveChannel(client, message).execute();
    if (!archiveChannel) {
      console.log('No archive channel! :(');
      await message.reply('아카이브 채널이 없어 백업을 수행할 수 없습니다 ㅠ')
      return;
    }

    const allPins = await getAllPinsInThisGuild(message.guild!!, false/* Bring all */);
    const progressMessage = await message.reply(`백업 중... 0/${allPins.length}`);

    for (let i = 0; i < allPins.length; i++) {
      await progressMessage.edit(`백업 중... ${i+1}/${allPins.length}`);

      const pin = allPins[i];
      await new ArchiveMessage(client, pin).execute(archiveChannel);
    }

    await progressMessage.edit(`${allPins.length}개의 고정 메시지를 '${archiveChannel.name}' 채널로 복사하였습니다.`);
  }
}
