import {warn} from './logging';
import config from '../../config';
import MessageRef from '../entities/MessageRef';
import ArchiveService from '../service/ArchiveService';
import ChannelService from '../service/ChannelService';
import {extractEmbed, stringifyMessage} from './message';
import {ChannelType, EmbedBuilder, Guild, Message} from 'discord.js';

/**
 * 아카이브에 실릴 embed를 작성합니다.
 * @param guild 길드
 * @param message 아카이브 대상이 되는 원본 메시지
 */
export function composeArchiveEmbed(guild: Guild, message: Message): EmbedBuilder {
  const name = message.author.username;
  const avatarUrl = message.author.avatarURL();
  const pinContent = message.content;
  const contentDate = message.createdAt.getTime();

  const guildId = guild.id;
  const channelId = message.channel.id;
  const messageId = message.id;
  const firstImageUrl = message.attachments.first()?.url ?? null;

  const messageUrl = `https://discordapp.com/channels/${guildId}/${channelId}/${messageId}`;
  const jumpToMessageLink = `\n\n[${config.resources.string.jumpToMessage}](${messageUrl})`;

  const channelName = message.channel.type === ChannelType.DM ? 'DM' : message.channel.name;

  return new EmbedBuilder()
    .setDescription(pinContent + jumpToMessageLink)
    .setColor(config.services.discord.bot.themeColor)
    .setTimestamp(contentDate)
    .setAuthor({name: name, iconURL: avatarUrl || undefined, url: messageUrl})
    .setImage(firstImageUrl)
    .setFooter({text: channelName ?? 'DM'});
}

/**
 * 아카이브로부터 원본 메시지의 MessageRef를 추출해냅니다.
 * 아카이브 내에서 원본 메시지의 정보는 embed 속 author의 url 필드에 존재합니다.
 * @param archive 아카이브 메시지
 */
export function extractOriginalMessageRef(archive: Message): MessageRef | undefined {
  const embed = extractEmbed(archive);
  if (embed == null) {
    warn(
      `아카이브로부터 원본 메시지 정보를 알아낼 수 없습니다. 아카이브인 ${stringifyMessage(
        archive
      )}에 embed가 없습니다.`
    );
    return undefined;
  }

  const author = embed.author;
  if (author == null) {
    warn(
      `아카이브로부터 원본 메시지 정보를 알아낼 수 없습니다. 아카이브인 ${stringifyMessage(
        archive
      )} 속 embed에 author 정보가 없습니다.`
    );
    return undefined;
  }

  const url = author.url;
  if (url == null) {
    warn(
      `아카이브로부터 원본 메시지 정보를 알아낼 수 없습니다. 아카이브인 ${stringifyMessage(
        archive
      )} 속 embed에 author url이 없습니다.`
    );
    return undefined;
  }

  const regex = new RegExp(
    /^https:\/\/discordapp.com\/channels\/(?<GUILD_ID>[0-9]*)\/(?<CHANNEL_ID>[0-9]*)\/(?<MESSAGE_ID>[0-9]*)\/?$/
  );

  const hasValidForm = regex.test(url);
  if (!hasValidForm) {
    warn(
      `아카이브로부터 원본 메시지 정보를 알아낼 수 없습니다. 아카이브인 ${stringifyMessage(
        archive
      )} 속 embed에 들어 있는 author url이 올바른 메시지 url 형태가 아닙니다.`
    );
    return undefined;
  }

  const parts = regex.exec(url);
  const guildId = parts?.groups?.GUILD_ID;
  const channelId = parts?.groups?.CHANNEL_ID;
  const messageId = parts?.groups?.MESSAGE_ID;

  if (guildId == null || channelId == null || messageId == null) {
    warn(
      `아카이브로부터 원본 메시지 정보를 알아낼 수 없습니다. 아카이브인 ${stringifyMessage(
        archive
      )} 속 embed에 들어 있는 author url을 해석했는데, guildId, channelId, messageId 중 하나 이상이 없습니다. guildId는 '${guildId}', channelId는 '${channelId}', messageId는 '${messageId}'입니다.`
    );
    return undefined;
  }

  return new MessageRef(guildId, channelId, messageId);
}

/**
 * 이 메시지가 이미 아카이브되었는지 여부를 가져옵니다.
 * 이 메시지를 가리키는(url) 아카이브가 고정 메시지 채널에 있다면 해당 메시지는 아카이브된 것입니다.
 * @param message 아카이브 여부를 확인할 메시지
 */
export async function isArchived(message: Message): Promise<Boolean> {
  const archiveChannel = await new ChannelService().findArchiveChannel(message.guild!!);
  if (archiveChannel == null) {
    warn(
      `메시지의 아카이브 여부를 확인하려는데, 아카이브 채널이 없습니다. 따라서 ${stringifyMessage(
        message
      )}는 아카이브되지 않은 것으로 간주합니다.`
    );
    return false;
  }

  const archive = await new ArchiveService(archiveChannel).findArchive(message);

  return archive != null;
}
