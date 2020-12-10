import getEnv from "./lib/utils/env";
import SyncCommand from "./lib/command/SyncCommand";

export default {
  bot: {
    name: '',
    themeColor: 0x7289da
  },

  command: {
    prefix: '!!',
    list: [
      new SyncCommand('고정메시지모두백업')
    ]
  },

  auth: {
    token: getEnv('TOKEN') || 'YEAH'
  },

  confirmDialog: {
    timeout: 30 * 1000
  },

  archiveChannel: {
    channelName: '고정메시지',
    topicKeyword: '아카이브'
  }
}
