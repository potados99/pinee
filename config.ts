import getEnv from "./lib/utils/env";
import SyncCommand from "./lib/command/SyncCommand";

export default {
  bot: {
    name: '',
    themeColor: 0x836DC4
  },

  command: {
    prefix: '!!',
    list: [
      new SyncCommand('싱크'),
    ]
  },

  auth: {
    token: getEnv('TOKEN') || 'YEAH'
  },

  confirmDialog: {
    timeout: 90 * 1000
  },

  archiveChannel: {
    channelName: '고정메시지',
    topicKeyword: '아카이브'
  },

  string: {
    jumpToMessage: '메시지로 이동'
  }
}
