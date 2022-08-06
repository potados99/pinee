import {error} from '../utils/logging';
import {Message} from 'discord.js';
import Responder from './Responder';
import ArchiveService from '../service/ArchiveService';
import GetOrCreateArchiveChannel from '../interactor/GetOrCreateArchiveChannel';

/**
 * 메시지가 변경되었을 때에 반응하는 responder입니다.
 */
export default class PinMessageUpdateResponder implements Responder {
  constructor(private readonly message: Message) {}

  public async handle() {
    const archiveChannel = await new GetOrCreateArchiveChannel(this.message).execute();
    if (archiveChannel == null) {
      error(
        `아카이브를 진행하기 위해 새 아카이브 채널을 생성하거나 기존 아카이브 채널을 가져왔는데도 존재하지 않습니다. 더이상 작업을 진행할 수 없습니다.`
      );
      return;
    }

    await new ArchiveService(archiveChannel).createOrUpdateArchive(this.message);
  }
}
