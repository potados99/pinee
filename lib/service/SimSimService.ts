import fetch from 'isomorphic-fetch';
import config from '../../config';
import {Message} from 'discord.js';
import {withProbability} from '../utils/probability';

export default class SimSimService {
  constructor(private readonly message: Message) {}

  async getAnswer(): Promise<string> {
    const response = await fetch('https://wsapi.simsimi.com/190410/talk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.services.simsimi.apiKey,
      },
      body: JSON.stringify({
        utext: this.message.cleanContent,
        lang: this.selectLanguage(),
        atext_bad_prob_max: 0.0,
      }),
    });

    const {status, atext} = await response.json();

    switch (status) {
      case 227:
        return '🚧 파라미터 누락!';
      case 228:
        return '(이해 못함)';
      case 403:
        return '🚧 키 잘못됨!';
      case 429:
        return '(내향에너지 충전중...다음달에 돌아올게요)';
      case undefined:
        return '🚧 챗봇 응답 코드가 없음!';
    }

    if (atext == null || atext.length === 0) {
      return '🚧 챗봇 응답 내용이 없음!';
    }

    return atext as string;
  }

  private selectLanguage(): string {
    let lang = 'ko';

    withProbability(0.1, () => {
      lang = 'en';
    });

    return lang;
  }
}
