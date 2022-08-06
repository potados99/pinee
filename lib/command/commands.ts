import {REST} from '@discordjs/rest';
import config from '../../config';
import {Routes} from 'discord-api-types/rest/v10';
import {SlashCommandBuilder} from '@discordjs/builders';

export default async function registerCommands(applicationId: string) {
  const commands = [new SlashCommandBuilder().setName('안뇽').setDescription('안뇽하세용')].map((c) => c.toJSON());
  const rest = new REST({version: '10'}).setToken(config.services.discord.bot.auth.token);
  await rest.put(Routes.applicationCommands(applicationId), {body: commands});
}
