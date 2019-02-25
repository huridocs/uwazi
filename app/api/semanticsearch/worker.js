import EventEmitter from 'events';
import async from 'async';
import search, { COMPLETED, STOPPED } from './semanticSearch';

class Worker extends EventEmitter {
  constructor(searchId, batchSize = 10) {
    super();
    this.searchId = searchId;
    this.batchSize = batchSize;
    this.done = false;
    this.stopped = false;
  }

  async processBatch() {
    const res = await search.processSearchLimit(this.searchId, this.batchSize);
    this.done = res.status === COMPLETED;
    this.stopped = res.status === STOPPED;
    this.emit('update', res);
  }

  start() {
    async.whilst(
      () => !(this.done || this.stopped),
      (cb) => {
        this.processBatch().then(cb).catch(cb);
      },
      (err) => {
        if (err) {
          this.emit('error', err);
        } else {
          if (this.done) {
            this.emit('done');
          }
          if (this.stopped) {
            this.emit('stopped');
          }
        }
      }
    );
  }
}

export default Worker;
