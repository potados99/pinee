import {info} from './lib/utils/logging';
import startBot from './lib/bot';
import {registerCommands} from './lib/commands';

startBot().then(() => info('봇을 실행하였습니다.'));
registerCommands().then(() => info('명령을 등록하였습니다.'));
