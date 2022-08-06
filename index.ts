import {info} from './lib/utils/logging';
import startBot from './lib/bot';

startBot().then((_) => info('봇을 실행하였습니다.'));
