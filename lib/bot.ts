import config from '../config';
import Discord, {GatewayIntentBits, Partials} from 'discord.js';
import {onReady} from './routes/ready';
import {onMessage} from './routes/message';
import {onReactionAdd} from './routes/reaction';
import registerCommands from './command/commands';
import {onMessageUpdate} from './routes/update';
import {messagesFetched, reactionsFetched} from './utils/message';

export default async function startBot() {
  const client = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds, // 기본 필수
      GatewayIntentBits.GuildMessages, // 길드 메시지 수신하려면 필요
      GatewayIntentBits.GuildMessageReactions, // 길드 메시지 리액션 수신하려면 필요
      GatewayIntentBits.DirectMessages, // 다이렉스 메시지 수신하려면 필요
    ],
    partials: [
      Partials.Channel, // Discord API v8부터 필요
      Partials.Message,
      Partials.Reaction,
    ],
  });

  client.on('ready', async () => {
    await onReady(client);
  });

  client.on('messageCreate', async (message) => {
    await onMessage(client, message);
  });

  client.on('messageUpdate', async (rawBefore, rawAfter) => {
    const [before, after] = await messagesFetched(rawBefore, rawAfter);

    await onMessageUpdate(client, before, after);
  });

  client.on('messageReactionAdd', async (rawReaction) => {
    const [reaction] = await reactionsFetched(rawReaction);

    await onReactionAdd(reaction);
  });

  await client.login(config.services.discord.bot.auth.token);

  await registerCommands('786876831181045781');
}
