import getEnv from "./lib/utils/env";

export default {
  /**
   * 봇의 행동에 관한 파라미터를 정의합니다.
   */
  behaviors: {
    archiving: {
      channel: {
        newArchiveChannelName: "고정메시지",
        topicKeyword: "아카이브"
      }
    },
    interaction: {
      confirm: {
        timeoutMillis: 600 * 1000
      }
    },
    pinByReaction: {
      availablePins: ["📌", "📍", "🖇"],
      pinCountThreshold: 3
    }
  },

  /**
   * 외부 서비스를 사용하기 위해 필요한 파라미터를 정의합니다.
   */
  services: {
    discord: {
      bot: {
        name: "Pinee",
        themeColor: 0x836DC4,
        auth: {
          token: getEnv("TOKEN") || "YEAH"
        }
      },
      api: {
        fetchLimitPerRequest: 100 // 디스코드 정책
      }
    },
    redis: {
      url: getEnv("REDISTOGO_URL") || "anything haha"
    },
    simsimi: {
      apiKey: getEnv("SIMSIMI_API_KEY") || "adadad"
    }
  },

  /**
   * 별도로 관리하는 리소스(스트링 등)를 정의합니다.
   */
  resources: {
    string: {
      jumpToMessage: "메시지로 이동"
    }
  }
};
