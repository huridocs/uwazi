import EventEmitter3 from 'eventemitter3';

import { Callback, Emitter } from 'api/common.v2/contracts/emitter/Emitter';
import { Event } from 'api/common.v2/contracts/emitter/Event';

export class Emitter3Adapter implements Emitter {
  private instance: EventEmitter3;

  constructor() {
    this.instance = new EventEmitter3();
  }

  emit(event: Event): void {
    this.instance.emit(event.name, event);
  }

  listen(name: string, callback: Callback): void {
    this.instance.on(name, callback);
  }
}
