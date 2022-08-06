import config from '../config';
import {onReady} from './routes/ready';
import {onReactionAdd} from './routes/reaction';
import onInteractionCreate from './routes/interaction';
import {onMessageCreate, onMessageUpdate} from './routes/message';
import {messagesFetched, reactionsFetched} from './utils/message';
import Discord, {GatewayIntentBits, Partials} from 'discord.js';

export default async function startBot() {
  const client = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds, // 기본 필수입니다. 없으면 아무것도 안 돼요.
      GatewayIntentBits.GuildMessages, // 길드 메시지를 수신하려면 필요합니다.
      GatewayIntentBits.GuildMessageReactions, // 길드 메시지 리액션을 수신하려면 필요합니다.
      GatewayIntentBits.DirectMessages, // 다이렉트 메시지를 수신하려면 필요합니다.
      GatewayIntentBits.MessageContent, // 봇 시작 이후 들어오는 메시지의 내용을 확인하려면 필요합니다. 없으면 fetch해도 메시지 내용을 못 가져와요.
    ],
    partials: [
      Partials.Channel, // 다이렉트 메시지를 받으려면 Discord API v8부터 필요합니다. 링크 참조: https://stackoverflow.com/questions/68700270/event-messagecreate-not-firing-emitting-when-i-send-a-dm-to-my-bot-discord-js-v
      Partials.Message, // 캐시 범위를 벗어난 message 이벤트를 수신하려면 필요합니다.
      Partials.Reaction, // 캐시 범위를 벗어난 reaction 이벤트를 수신하려면 필요합니다.
    ],
  });

  client.on('ready', async () => {
    await onReady(client);
  });

  client.on('messageCreate', async (message) => {
    await onMessageCreate(client, message);
  });

  client.on('messageUpdate', async (rawBefore, rawAfter) => {
    const [before, after] = await messagesFetched(rawBefore, rawAfter);

    await onMessageUpdate(client, before, after);
  });

  client.on('messageReactionAdd', async (rawReaction) => {
    const [reaction] = await reactionsFetched(rawReaction);

    await onReactionAdd(reaction);
  });

  client.on('interactionCreate', async (interaction) => {
    await onInteractionCreate(interaction);
  });

  await client.login(config.services.discord.bot.auth.token);
}
