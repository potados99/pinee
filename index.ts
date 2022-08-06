import {log} from './lib/utils/logging';
import startBot from './lib/bot';

startBot().then((_) => log('봇을 실행하였습니다.'));
