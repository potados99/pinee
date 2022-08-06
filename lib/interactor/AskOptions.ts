/**
 * 사용자에게 물어볼 때에 사용할 옵션들입니다.
 */
export default class AskOptions {
  public choices: string[];
  public onlyForOwner: boolean;
  public replyTimeout: number;
}
