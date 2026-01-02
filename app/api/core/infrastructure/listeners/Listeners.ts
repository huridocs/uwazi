import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { LogEntityCreatedListener } from './LogEntityCreatedListener';

const registerEventListenersV2 = () => {
  EventEmitterFactory.default().listen(LogEntityCreatedListener);
};

export { registerEventListenersV2 };
