import Command from "./Command";
import { Client, GuildChannel, Message, NewsChannel, PermissionOverwrites, TextChannel } from "discord.js";
import AskUser from "../interactor/AskUser";
import config from "../../config";
import GetArchiveChannel from "../interactor/GetArchiveChannel";
import ArchiveMessage from "../interactor/ArchiveMessage";

export default class SyncCommand extends Command {
  constructor(command: string) {
    super(command);
  }

  public getName() {
    return this.name;
  }

  public async execute(client: Client, message: Message): Promise<void> {

    if (message.author.id !== message.guild!!.ownerID) {
      console.log('Only owner can do it!');
      return;
    }

    const keep = await new AskUser(client, message).execute({
      title: "고정메시지 백업",
      description: "모든 고정 메시지를 읽어서 오래된 메시지부터 아카이브합니다. 원본 메시지에는 영향이 없습니다.",
      color: config.bot.themeColor
    })

    if (!keep) {
      return;
    }

    const archiveChannel = await new GetArchiveChannel(client, message).execute();
    if (!archiveChannel) {
      console.log('No archive channel! :(');
      await message.reply('아카이브 채널이 없어 백업을 수행할 수 없습니다 ㅠ')
      return;
    }

    const allPins = await this.getAllPins(client, message);

    const progressMessage = await message.reply(`백업 중... 0/${allPins.length}`);

    for (let i = 0; i < allPins.length; i++) {
      const pin = allPins[i];

      await progressMessage.edit(`백업 중... ${i+1}/${allPins.length}`);
      await new ArchiveMessage(client, pin).execute(archiveChannel);
    }

    await progressMessage.edit(`${allPins.length}개의 고정 메시지를 '${archiveChannel.name}' 채널로 복사하였습니다.`);
  }

  async getAllPins(client: Client, message: Message, publicOnly: boolean = true) {
    const allChannels = message.guild!!.channels.cache.array();

    const allPins: Message[] = [];

    for (const channel of allChannels) {
      // Iterate through channels that has 'messages'.
      if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
        continue;
      }

      // Backup only public channels/
      if (publicOnly && this.isNonPublicChannel(channel)) {
        continue;
      }

      const pins = (await channel.messages.fetchPinned()).array();
      allPins.push(...pins);
    }

    // Create date ascending.
    allPins.sort((left: Message, right: Message) => left.createdTimestamp - right.createdTimestamp);

    return allPins;
  }

  isNonPublicChannel(channel: GuildChannel) {
    // @ts-ignore
    const channelPermissionsOverwrites: Map<string, PermissionOverwrites> = channel.permissionOverwrites;

    for (const overwrite of channelPermissionsOverwrites.values()) {
      const isAboutRole = overwrite.type === "role";
      const isAboutMember = overwrite.type === "member";
      const readDenied = overwrite.deny.bitfield & 1024;

      if ((isAboutRole || isAboutMember) && readDenied) {
        return true;
      }
    }

    return false;
  }
}
