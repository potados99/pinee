import {REST} from '@discordjs/rest';
import config from '../config';
import {Routes} from 'discord-api-types/rest/v10';
import {SlashCommandBuilder} from '@discordjs/builders';
import {ChannelType, ChatInputCommandInteraction, TextChannel} from 'discord.js';

export type Command = {
  definition: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  ephemeral: boolean;
  handler: (interaction: ChatInputCommandInteraction) => Promise<string>;
};

export const commands: Command[] = [
  {
    definition: new SlashCommandBuilder()
      .setName('말하기')
      .setDescription(`${config.services.discord.bot.name}이(가) 대신 전해드립니다.`)
      .addStringOption((option) => option.setName('할말').setDescription('대신 전할 말입니다.').setRequired(true))
      .addChannelOption((option) =>
        option
          .setName('어디에')
          .setDescription('말할 채널입니다. 없으면 현재 채널입니다.')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      ),
    ephemeral: true,
    handler: async (interaction) => {
      const message = interaction.options.getString('할말', true);
      const channel = interaction.options.getChannel('어디에', false) as TextChannel;

      await (channel || interaction.channel).send(message);

      return '잘 처리하였습니다.';
    },
  },
  {
    definition: new SlashCommandBuilder().setName('주사위').setDescription('신은 주사위를 던지..ㅂ니다'),
    ephemeral: false,
    handler: async () => {
      const possibleCases = [
        '⠀\n      ⬤\n⠀',
        '⬤\n\n            ⬤',
        '⬤\n      ⬤\n            ⬤',
        '⬤       ⬤\n\n⬤       ⬤',
        '⬤       ⬤\n      ⬤\n⬤       ⬤',
        '⬤       ⬤\n⬤       ⬤\n⬤       ⬤',
      ];

      return possibleCases[Math.floor(Math.random() * possibleCases.length)];
    },
  },
];

export async function registerCommands() {
  const rest = new REST({version: '10'}).setToken(config.services.discord.bot.authToken);
  await rest.put(Routes.applicationCommands(config.services.discord.bot.applicationId), {
    body: commands.map((c) => c.definition.toJSON()),
  });
}
