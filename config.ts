import getEnv from "./lib/utils/env";
import SyncCommand from "./lib/command/SyncCommand";

export default {
  bot: {
    name: "",
    themeColor: 0x836DC4
  },

  api: {
    fetchLimitPerRequest: 100 // Limited by Discord API policy,
  },

  command: {
    prefix: "!!"
  },

  auth: {
    token: getEnv("TOKEN") || "YEAH"
  },

  confirmDialog: {
    timeout: 600 * 1000
  },

  archiveChannel: {
    channelName: "고정메시지",
    topicKeyword: "아카이브"
  },

  string: {
    jumpToMessage: "메시지로 이동"
  },

  redis: {
    url: getEnv("REDISTOGO_URL") || "anything haha"
  },

  pinByReaction: {
    threshold: 3
  }
};
