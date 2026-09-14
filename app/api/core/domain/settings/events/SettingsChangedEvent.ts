import { Event } from '#api/core/libs/eventEmitter/Event.js';

class SettingsChangedEvent extends Event<Record<string, never>> {}

export { SettingsChangedEvent };
