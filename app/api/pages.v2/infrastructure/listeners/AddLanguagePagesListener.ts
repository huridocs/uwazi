import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageAddedEvent } from '#api/core/domain/language/events/LanguageAddedEvent.js';
import { AddLanguageToPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/AddLanguageToPagesUseCaseFactory.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';

@PrivilegedJob()
class AddLanguagePagesListener extends Listener<LanguageAddedEvent, {}> {
  static eventName = LanguageAddedEvent.name;

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: LanguageAddedEvent['payload'],
    _jobInfo?: JobInfo
  ): Promise<void> {
    const { language, defaultLanguage } = params;
    await AddLanguageToPagesUseCaseFactory.default().execute({ language, defaultLanguage });
  }
}

EventEmitterFactory.registry.register(AddLanguagePagesListener);

export { AddLanguagePagesListener };
