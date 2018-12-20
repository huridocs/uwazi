import EventEmitter from 'events';
import async from 'async';
import search, { COMPLETED } from './semanticSearch';

class Worker extends EventEmitter {
  constructor(searchId, batchSize = 10) {
    super();
    this.searchId = searchId;
    this.batchSize = batchSize;
    this.done = false;
  }

  async processBatch() {
    const res = await search.processSearchLimit(this.searchId, this.batchSize);
    this.done = res.status === COMPLETED;
    this.emit('update', res);
  }

  start() {
    async.whilst(
      () => !this.done,
      (cb) => {
        this.processBatch().then(cb).catch(cb);
      },
      (err) => {
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('done');
        }
      }
    );
  }
}

export default Worker;
