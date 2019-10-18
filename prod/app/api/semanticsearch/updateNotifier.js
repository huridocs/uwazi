"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.UpdateNotifier = void 0;var _semanticSearch = _interopRequireDefault(require("./semanticSearch"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class UpdateNotifier {
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
      const docs = await _semanticSearch.default.getDocumentResultsByIds(searchId, processedDocuments);
      sockets.emit('semanticSearchUpdated', { updatedSearch, docs });
    });
    closedSessions.forEach(id => this.deleteRequest(id));
    return Promise.all(ps);
  }}exports.UpdateNotifier = UpdateNotifier;var _default =


new UpdateNotifier();exports.default = _default;