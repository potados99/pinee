import getEnv from "./lib/utils/env";
import SyncCommand from "./lib/command/SyncCommand";
import MigrateCommand from "./lib/command/MigrateCommand";

export default {
  bot: {
    name: '',
    themeColor: 0x836DC4
  },

  command: {
    prefix: '!!',
    list: [
      new SyncCommand('고정메시지모두백업'),
      new MigrateCommand('마이그레이션시작')
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
  },

  string: {
    jumpToMessage: '메시지로 이동'
  }
}
