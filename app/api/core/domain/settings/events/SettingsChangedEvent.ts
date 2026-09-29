import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { SettingsChanges } from '../SettingsDiff.js';

class SettingsChangedEvent extends Event<{ changes: SettingsChanges }> {}

export { SettingsChangedEvent };
