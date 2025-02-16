import { Emitter } from 'api/common.v2/contracts/emitter/Emitter';

import { Emitter3Adapter } from './EventEmitter3Adapter';

export class EmitterFactory {
  static createDefault(): Emitter {
    return new Emitter3Adapter();
  }
}
