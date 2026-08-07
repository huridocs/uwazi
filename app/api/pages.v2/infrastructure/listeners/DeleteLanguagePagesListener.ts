import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { LanguageDeletedEvent } from '#api/core/domain/language/events/LanguageDeletedEvent.js';
import { RemoveLanguageFromPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/RemoveLanguageFromPagesUseCaseFactory.js';
import { HeartbeatCallback, JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

@PrivilegedJob()
class DeleteLanguagePagesListener extends Listener<LanguageDeletedEvent, {}> {
  static eventName = LanguageDeletedEvent.name;

  protected async handle(
    _heartbeat: HeartbeatCallback,
    params: LanguageDeletedEvent['payload'],
    _jobInfo?: JobInfo
  ): Promise<void> {
    const { language } = params;
    await RemoveLanguageFromPagesUseCaseFactory.default().execute({ language });
  }
}

EventEmitterFactory.registry.register(DeleteLanguagePagesListener);

export { DeleteLanguagePagesListener };
