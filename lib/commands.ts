import {REST} from '@discordjs/rest';
import config from '../config';
import {Routes} from 'discord-api-types/rest/v10';
import {SlashCommandBuilder} from '@discordjs/builders';
import {CacheType, ChannelType, ChatInputCommandInteraction, TextChannel} from 'discord.js';

export type Command = {
  definition: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  handler: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<string>;
};

export const commands: Command[] = [
  {
    definition: new SlashCommandBuilder()
      .setName('말하기')
      .setDescription(`${config.services.discord.bot.name}이(가) 대신 말해줍니다.`)
      .addStringOption((option) => option.setName('할말').setDescription('할 말입니다.').setRequired(true))
      .addChannelOption((option) =>
        option
          .setName('어디에')
          .setDescription('말할 채널입니다. 없으면 현재 채널입니다.')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      ),
    handler: async (interaction) => {
      const message = interaction.options.getString('할말', true);
      const channel = interaction.options.getChannel('어디에', false) as TextChannel;

      await (channel || interaction.channel).send(message);

      return '잘 처리하였습니다.';
    },
  },
];

export async function registerCommands() {
  const rest = new REST({version: '10'}).setToken(config.services.discord.bot.auth.token);
  await rest.put(Routes.applicationCommands('786876831181045781'), {body: commands.map((c) => c.definition.toJSON())});
}
