import { Message } from "discord.js";
import fetch from "isomorphic-fetch";
import config from "../../config";

export default class DmService {
  constructor(private readonly message: Message) {
  }

  async getAnswer(): Promise<string> {
    const response = await fetch('https://wsapi.simsimi.com/190410/talk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.simsimi.apiKey,
      },
      body: JSON.stringify({
        "utext": this.message.content,
        "lang": "ko",
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
}
