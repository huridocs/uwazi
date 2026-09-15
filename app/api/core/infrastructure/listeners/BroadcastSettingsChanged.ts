import { Listener } from '#api/core/libs/eventEmitter/Listener.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { SettingsQueryService } from '#api/core/application/settings/SettingsQueryService.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';

type Deps = {
  settingsQuery: SettingsQueryService;
  sockets: WebSockets;
};

@PrivilegedJob()
class BroadcastSettingsChanged extends Listener<SettingsChangedEvent, Deps> {
  static eventName = SettingsChangedEvent.name;

  async handle(
    _heartbeat: HeartbeatCallback,
    _params: SettingsChangedEvent['payload'],
    _jobInfo?: JobInfo
  ): Promise<void> {
    const payload = await this.deps.settingsQuery.forBroadcast();
    this.deps.sockets.emitToTenant(ExecutionContext.tenant.name, 'updateSettings', payload);
  }
}

EventEmitterFactory.registry.register(BroadcastSettingsChanged);

export { BroadcastSettingsChanged };
export type { Deps as BroadcastSettingsChangedDeps };
