import Worker from './worker';
import search from './semanticSearch';

const NUM_WORKERS = 3;

class WorkerManager {
  constructor() {
    this.workers = {};
  }
  get currentWorkersCount() {
    return Object.keys(this.workers).length;
  }
  async start() {
    const pendingSearches = await search.getPendingSearches();
    const toProcess = pendingSearches > NUM_WORKERS ?
      pendingSearches.slice(0, NUM_WORKERS) : pendingSearches;
    toProcess.forEach(newSearch => this.notifyNewSearch(newSearch._id));
  }
  notifyNewSearch(searchId) {
    console.log('NEW SEARCH', searchId);
    if (this.currentWorkersCount > NUM_WORKERS) {
      return;
    }
    const worker = new Worker(searchId);
    worker.on('done', () => this.onWorkerDone(searchId));
    worker.on('update', update => console.log('SEARCH UPDATE', searchId, update));
    this.workers[searchId] = worker;
    worker.start();
  }
  async onWorkerDone(searchId) {
    console.log('SEARCH DONE', searchId);
    delete this.workers[searchId];
    if (this.currentWorkersCount < NUM_WORKERS) {
      const [newSearch] = await search.getPendingSearches();
      if (newSearch) {
        this.notifyNewSearch(newSearch._id);
      }
    }
  }
}

const workerManager = new WorkerManager();

export default workerManager;

