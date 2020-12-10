import getEnv from "./lib/utils/env";

export default {
  bot: {
    name: '',
    themeColor: 0x7289da
  },

  auth: {
    token: getEnv('TOKEN') || 'YEAH'
  },

  confirmDialog: {
    timeout: 15 * 1000
  },

  archiveChannel: {
    channelName: '고정메시지',
    topicKeyword: '아카이브'
  }
}
