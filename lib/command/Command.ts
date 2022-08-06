import {Message} from 'discord.js';

export default class Command {
  protected name: string;

  constructor(command: string) {
    this.name = command;
  }

  public getName() {
    return this.name;
  }

  async execute(message: Message) {
    throw new Error('Not implemented!');
  }
}
