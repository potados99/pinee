import TellUser from './TellUser';
import {isOwner} from '../utils/user';
import AskOptions from './AskOptions';
import Interactor from './Interactor';
import {EmbedData, Message, MessageReaction, User} from 'discord.js';

/**
 * 여러 옵션을 가지고 사용자에게 의사를 물어보는 상호작용입니다.
 */
export default class AskUserWithOptions implements Interactor<EmbedData, string | undefined> {
  constructor(private readonly message: Message, private readonly options: AskOptions) {}

  public async execute(messageData: EmbedData): Promise<string | undefined> {
    const dialogSent = await this.ask(messageData);

    return await this.waitForReply(dialogSent);
  }

  private async ask(messageData: EmbedData) {
    const confirmDialogSent = await new TellUser(this.message).execute(messageData);

    // 선택할 수 있는 리액션을 먼저 붙여 두고, 사용자가 선택하도록 합니다.
    for (const option of this.options.choices!!) {
      await confirmDialogSent.react(option);
    }

    return confirmDialogSent;
  }

  private async waitForReply(dialogSent: Message) {
    const confirmReactionFilter = (reaction: MessageReaction, user: User) => {
      const oneOfAvailableOptions = this.options.choices!!.includes(reaction.emoji.name!!);
      const notByThisBot = user.id !== this.message.client.user?.id;
      const byPermittedUser = !this.options.onlyForOwner || isOwner(user, dialogSent.guild!!);

      return oneOfAvailableOptions && notByThisBot && byPermittedUser;
    };

    // 정해진 시간 안에 오는 첫 번째 리액션을 기다립니다.
    const usersAnswer = await dialogSent.awaitReactions({
      filter: confirmReactionFilter,
      max: 1,
      time: this.options.replyTimeout,
    });

    // 답변이 왔습니다.
    const firstAnswer = usersAnswer.first();

    // 확인 절차가 끝났으니 다이얼로그는 지웁니다.
    await dialogSent.delete();

    return firstAnswer?.emoji.name!!;
  }
}
