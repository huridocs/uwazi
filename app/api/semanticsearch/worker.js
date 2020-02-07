import EventEmitter from 'events';
import async from 'async';
import { COMPLETED, STOPPED } from './statuses';
import search from './semanticSearch';

class Worker extends EventEmitter {
  constructor(searchId, batchSize = 1) {
    super();
    this.searchId = searchId;
    this.batchSize = batchSize;
    this.done = false;
    this.stopped = false;
  }

  async processBatch() {
    const res = await search.processSearchLimit(this.searchId, this.batchSize);
    const { updatedSearch } = res;
    this.done = updatedSearch.status === COMPLETED;
    this.stopped = updatedSearch.status === STOPPED;
    this.emit('update', res);
  }

  start() {
    async.whilst(
      () => !(this.done || this.stopped),
      cb => {
        this.processBatch()
          .then(cb)
          .catch(cb);
      },
      err => {
        if (err) {
          // eslint-disable-next-line
          err.message = `Semantic search ${this.searchId} error: ${err.message}`;
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
