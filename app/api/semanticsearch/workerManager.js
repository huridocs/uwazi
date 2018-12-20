import Worker from './worker';
import search, { IN_PROGRESS, PENDING } from './semanticSearch';
import searchModel from './model';

const NUM_WORKERS = 3;

class WorkerManager {
  constructor() {
    this.workers = {};
  }
  get currentWorkersCount() {
    return Object.keys(this.workers).length;
  }
  get canAddWorker() {
    return this.currentWorkersCount < NUM_WORKERS;
  }
  async start() {
    let searchesToStart = searchModel.get(
      { status: IN_PROGRESS }, '', { limit: NUM_WORKERS });
    const remainingSlots = NUM_WORKERS - searchesToStart.length;
    if (remainingSlots > 0) {
      const pendingSearches = searchModel.get(
        { status: PENDING }, '', { limit: remainingSlots });
      searchesToStart = [...searchesToStart, ...pendingSearches];
    }
    searchesToStart.forEach(newSearch => this.notifyNewSearch(newSearch._id));
  }
  notifyNewSearch(searchId) {
    if (this.canAddWorker) {
      const worker = new Worker(searchId);
      worker.on('done', () => this.onWorkerDone(searchId));
      worker.on('update', update => this.onWorkerUpdate(searchId, update));
      worker.on('error', error => this.onWorkerError(searchId, error));
      this.workers[searchId] = worker;
      worker.start();
    }
  }
  async onWorkerDone(searchId) {
    delete this.workers[searchId];
    this.checkAndPushNewSearch();
  }
  async onWorkerError(searchId, error) {
    console.log('SEARCH ERROR', searchId, error);
    delete this.workers[searchId];
    this.checkAndPushNewSearch();
  }
  onWorkerUpdate(searchId, update) {
    console.log('SEARCH UPDATE', searchId, update)
  }
  async checkAndPushNewSearch() {
    if (this.canAddWorker) {
      const [newSearch] = await search.getPendingSearches();
      if (newSearch) {
        this.notifyNewSearch(newSearch._id);
      }
    }
  }
}

const workerManager = new WorkerManager();

export default workerManager;

