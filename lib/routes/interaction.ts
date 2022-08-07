import {info} from '../utils/logging';
import {commands} from '../commands';
import {Interaction} from 'discord.js';

export default async function onInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const {commandName} = interaction;

  info(`🤖 새 명령이 도착하였습니다: '${commandName}'`);

  const command = commands.find((c) => c.definition.name === commandName);

  const content = command == null ? '처리할 수 없는 명령입니다 ㅠㅡㅠ' : await command.handler(interaction);
  const ephemeral = command == null ? true : command.ephemeral;

  await interaction.reply({content, ephemeral});
}
