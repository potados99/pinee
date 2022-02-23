import fetch from "isomorphic-fetch";
import config from "../../config";
import { Message } from "discord.js";
import { withProbability } from "../utils/probability";

export default class SimSimService {
  constructor(private readonly message: Message) {
  }

  async getAnswer(): Promise<string> {
    if (this.message.content.includes('따라해봐:')) {
      const wordsToRepeat = this.message.content.split('따라해봐:').pop()?.trim();

      if (wordsToRepeat != null && wordsToRepeat.length > 0) {
        return wordsToRepeat;
      } else {
        return `잘 이해하지 못했어요. 무엇을 따라해야 하는거죠...?`;
      }
    }

    const response = await fetch('https://wsapi.simsimi.com/190410/talk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.simsimi.apiKey,
      },
      body: JSON.stringify({
        "utext": this.message.cleanContent,
        "lang": this.selectLanguage(),
        "atext_bad_prob_max": 0.0
      }),
    });

    const { status, atext } = await response.json();

    switch (status) {
      case 227: return '*고장남: 파라미터 누락!';
      case 228: return '(이해 못함)';
      case 403: return '*고장남: 키 잘못됨!';
      case 429: return '(내향에너지 충전중...다음달에 돌아올게요)'
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
