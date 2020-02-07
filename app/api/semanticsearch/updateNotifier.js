import semanticSearch from './semanticSearch';

export class UpdateNotifier {
  constructor() {
    this.requests = {};
  }

  addRequest(req) {
    this.requests[req.session.id] = req;
  }

  deleteRequest(id) {
    delete this.requests[id];
  }

  notifySearchUpdate(searchId, updates) {
    const closedSessions = [];
    const ps = Object.values(this.requests).map(async req => {
      const sockets = req.getCurrentSessionSockets();
      if (sockets.sockets.length === 0) {
        closedSessions.push(req.session.id);
      }
      const { updatedSearch, processedDocuments } = updates;
      const docs = await semanticSearch.getDocumentResultsByIds(searchId, processedDocuments);
      sockets.emit('semanticSearchUpdated', { updatedSearch, docs });
    });
    closedSessions.forEach(id => this.deleteRequest(id));
    return Promise.all(ps);
  }
}

export default new UpdateNotifier();
