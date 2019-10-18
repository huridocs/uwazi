"use strict";
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _immutable = _interopRequireDefault(require("immutable"));
var _api = _interopRequireDefault(require("../../../utils/api"));

var _uniqueID = require("../../../../shared/uniqueID.js");
var _Documents = require("../../../Documents");
var _config = require("../../../config.js");
var notificationsTypes = _interopRequireWildcard(require("../../../Notifications/actions/actionTypes"));
var _reactReduxForm = require("react-redux-form");
var _Relationships = require("../../../Relationships");
var _RequestParams = require("../../../utils/RequestParams");
var actions = _interopRequireWildcard(require("../documentActions"));
var types = _interopRequireWildcard(require("../actionTypes"));
var _PDF = require("../../../PDF");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('documentActions', () => {
  describe('setDocument()', () => {
    it('should return a SET_REFERENCES type action with the document', () => {
      const action = actions.setDocument('document', 'html');
      expect(action).toEqual({ type: types.SET_DOCUMENT, document: 'document', html: 'html' });
    });
  });
  describe('resetDocumentViewer()', () => {
    it('should return a RESET_DOCUMENT_VIEWER', () => {
      const action = actions.resetDocumentViewer();
      expect(action).toEqual({ type: types.RESET_DOCUMENT_VIEWER });
    });
  });
  describe('loadDefaultViewerMenu()', () => {
    it('should return a LOAD_DEFAULT_VIEWER_MENU', () => {
      const action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({ type: types.LOAD_DEFAULT_VIEWER_MENU });
    });
  });
  describe('openReferencePanel()', () => {
    it('should return a OPEN_REFERENCE_PANEL', () => {
      const action = actions.loadDefaultViewerMenu();
      expect(action).toEqual({ type: types.LOAD_DEFAULT_VIEWER_MENU });
    });
  });

  describe('addToToc', () => {
    it('should populate doc form, and add the selected text to its correct place', () => {
      spyOn(_reactReduxForm.actions, 'load').and.returnValue({ type: 'loadAction' });
      const reference = { sourceDocument: '123', sourceRange: { start: 12, end: 23, text: 'Chapter 1' } };
      const chapter1 = { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0 };
      const chapter2 = { range: { start: 22, end: 43 }, label: 'Chapter 2', indentation: 0 };

      const expectedActions = [
      { type: 'documentViewer/tocBeingEdited/SET', value: true },
      { type: 'loadAction' },
      { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
      { type: 'viewer.sidepanel.tab/SET', value: 'toc' }];


      const store = mockStore({
        documentViewer: {
          tocForm: [],
          doc: _immutable.default.fromJS({
            toc: [chapter2] }) } });




      store.dispatch(actions.addToToc(reference));

      expect(store.getActions()).toEqual(expectedActions);
      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('documentViewer.tocForm', [chapter1, chapter2]);
    });

    describe('if document is already loaded', () => {
      it('should not reload the form', () => {
        spyOn(_reactReduxForm.actions, 'load').and.returnValue({ type: 'loadAction' });
        const reference = { sourceDocument: '123', sourceRange: { start: 12, end: 23, text: 'Chapter 1' } };
        const chapter1 = { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0 };
        const chapter2 = { range: { start: 22, end: 43 }, label: 'Chapter 2', indentation: 0 };
        const expectedActions = [
        { type: 'documentViewer/tocBeingEdited/SET', value: true },
        { type: 'loadAction' },
        { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
        { type: 'viewer.sidepanel.tab/SET', value: 'toc' }];

        const store = mockStore({
          documentViewer: {
            tocForm: [chapter2],
            doc: _immutable.default.fromJS({}) } });



        store.dispatch(actions.addToToc(reference));
        expect(store.getActions()).toEqual(expectedActions);
        expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('documentViewer.tocForm', [chapter1, chapter2]);
      });
    });
  });

  describe('removeFromToc', () => {
    it('should remove the toc entry from the form', () => {
      spyOn(_reactReduxForm.actions, 'load').and.returnValue({ type: 'loadAction' });
      const chapter1 = { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0, _id: 1 };
      const chapter2 = { range: { start: 22, end: 43 }, label: 'Chapter 2', indentation: 0, _id: 2 };

      const expectedActions = [
      { type: 'loadAction' }];


      const store = mockStore({
        documentViewer: {
          tocForm: [chapter1, chapter2],
          doc: _immutable.default.fromJS({
            toc: [] }) } });




      store.dispatch(actions.removeFromToc(chapter2));

      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('documentViewer.tocForm', [chapter1]);
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('indentTocElement', () => {
    it('should change the toc entry indentation', () => {
      const chapter1 = { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0, _id: 1 };
      const chapter2 = { range: { start: 22, end: 43 }, label: 'Chapter 2', indentation: 0, _id: 2 };

      const formState = [chapter1, chapter2];
      const store = mockStore({
        documentViewer: {
          tocForm: formState,
          doc: _immutable.default.fromJS({
            toc: [] }) } });




      store.dispatch(actions.indentTocElement(chapter2, 1));
      expect(store.getActions()[0].type).toBe('rrf/change');
      expect(store.getActions()[0].model).toBe('documentViewer.tocForm');
      expect(store.getActions()[0].value[1].indentation).toBe(1);
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      (0, _uniqueID.mockID)();
      _fetchMock.default.restore();
      _fetchMock.default.
      get(`${_config.APIURL}documents/search?searchTerm=term&fields=%5B%22field%22%5D`, { body: JSON.stringify('documents') }).
      get(`${_config.APIURL}entities?sharedId=targetId`, { body: JSON.stringify({ rows: [{ target: 'document', pdfInfo: 'test' }] }) }).
      get(`${_config.APIURL}entities?sharedId=docWithPDFRdy`, { body: JSON.stringify({ rows: [{ pdfInfo: 'processed pdf', _id: 'pdfReady' }] }) }).
      get(`${_config.APIURL}entities?sharedId=docWithPDFNotRdy`, {
        body: JSON.stringify({ rows: [{ _id: 'pdfNotReady', sharedId: 'shared', unwantedProp: 'unwanted', file: {} }] }) }).

      get(`${_config.APIURL}references/by_document?sharedId=targetId`, { body: JSON.stringify([{ connectedDocument: '1' }]) });
    });

    afterEach(() => _fetchMock.default.restore());

    describe('saveDocument', () => {
      it('should save the document (omitting fullText) and dispatch a notification on success', done => {
        spyOn(_Documents.documentsApi, 'save').and.returnValue(Promise.resolve({ sharedId: 'responseId' }));
        const doc = { name: 'doc', fullText: 'fullText' };
        spyOn(_Relationships.actions, 'reloadRelationships').and.returnValue({ type: 'reloadRelationships' });

        const expectedActions = [
        { type: notificationsTypes.NOTIFY, notification: { message: 'Document updated', type: 'success', id: 'unique_id' } },
        { type: types.VIEWER_UPDATE_DOCUMENT, doc: { name: 'doc', fullText: 'fullText' } },
        { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
        { type: 'viewer/doc/SET', value: { sharedId: 'responseId' } },
        { type: 'reloadRelationships' }];

        const store = mockStore({});

        store.dispatch(actions.saveDocument(doc)).
        then(() => {
          expect(_Documents.documentsApi.save).toHaveBeenCalledWith({ data: { name: 'doc' }, headers: {} });
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });

    describe('getDocument', () => {
      it('should return the document requested', async () => {
        const requestParams = new _RequestParams.RequestParams({ sharedId: 'docWithPDFRdy' });
        const doc = await actions.getDocument(requestParams);
        expect(doc.pdfInfo).toBe('processed pdf');
      });

      describe('when the doc does not have the pdf processed', () => {
        it('should process it and save it before it gets returned', async () => {
          spyOn(_PDF.PDFUtils, 'extractPDFInfo').and.returnValue(Promise.resolve('test'));
          const expected = { sharedId: 'shared', _id: 'pdfNotReady', pdfInfo: 'test' };
          spyOn(_api.default, 'post').and.returnValue(Promise.resolve({ json: expected }));
          const requestParams = new _RequestParams.RequestParams({ sharedId: 'docWithPDFNotRdy' });

          const doc = await actions.getDocument(requestParams);
          expect(_PDF.PDFUtils.extractPDFInfo).toHaveBeenCalledWith(`${_config.APIURL}documents/download?_id=${expected._id}`);
          expect(_api.default.post).toHaveBeenCalledWith('documents/pdfInfo', { data: expected, headers: {} });
          expect(expected).toBe(doc);
        });
      });
    });

    describe('saveToc', () => {
      it('should save the document with the new toc and dispatch a notification on success', done => {
        spyOn(_Documents.documentsApi, 'save').and.returnValue(Promise.resolve('response'));
        spyOn(_Relationships.actions, 'reloadRelationships').and.returnValue({ type: 'reloadRelationships' });
        const doc = { name: 'doc', _id: 'id', _rev: 'rev', sharedId: 'sharedId', file: { fileName: '123.pdf' } };
        const toc = [
        { range: { start: 12, end: 23 }, label: 'Chapter 1', indentation: 0 },
        { range: { start: 22, end: 44 }, label: 'Chapter 1.1', indentation: 1 }];


        const expectedActions = [
        { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
        { type: 'documentViewer/tocBeingEdited/SET', value: false },
        { type: notificationsTypes.NOTIFY, notification: { message: 'Document updated', type: 'success', id: 'unique_id' } },
        { type: types.VIEWER_UPDATE_DOCUMENT, doc: { _id: 'id', _rev: 'rev', sharedId: 'sharedId', toc, file: { fileName: '123.pdf' } } },
        { type: 'rrf/reset', model: 'documentViewer.sidepanel.metadata' },
        { type: 'viewer/doc/SET', value: 'response' },
        { type: 'reloadRelationships' }];

        const store = mockStore({
          documentViewer: {
            doc: _immutable.default.fromJS(doc) } });



        store.dispatch(actions.saveToc(toc)).
        then(() => {
          expect(_Documents.documentsApi.save).toHaveBeenCalledWith(
          { data: { _id: 'id', _rev: 'rev', sharedId: 'sharedId', toc, file: { fileName: '123.pdf' } }, headers: {} });

          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch a notification on success', done => {
        spyOn(_Documents.documentsApi, 'delete').and.returnValue(Promise.resolve('response'));
        const doc = { sharedId: 'sharedId', name: 'doc' };

        const expectedActions = [
        { type: notificationsTypes.NOTIFY, notification: { message: 'Document deleted', type: 'success', id: 'unique_id' } },
        { type: types.RESET_DOCUMENT_VIEWER },
        { type: 'REMOVE_DOCUMENT', doc: { sharedId: 'sharedId', name: 'doc' } },
        { type: 'UNSELECT_ALL_DOCUMENTS' }];

        const store = mockStore({});

        store.dispatch(actions.deleteDocument(doc)).
        then(() => {
          expect(_Documents.documentsApi.delete).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sharedId' }));
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });

    describe('loadTargetDocument', () => {
      it('should loadTargetDocument with id passed', done => {
        const targetId = 'targetId';

        const expectedActions = [
        { type: 'viewer/targetDoc/SET', value: { target: 'document', pdfInfo: 'test' } },
        { type: 'viewer/targetDocReferences/SET', value: [{ connectedDocument: '1' }] }];

        const store = mockStore({ locale: 'es' });

        store.dispatch(actions.loadTargetDocument(targetId)).
        then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });

    describe('cancelTargetDocument', () => {
      it('should reset ranged connection defaults', () => {
        const expectedActions = [
        { type: 'CANCEL_RANGED_CONNECTION' },
        { type: 'viewer/targetDoc/UNSET' },
        { type: 'viewer/targetDocReferences/UNSET' },
        { type: 'UNSET_TARGET_SELECTION' },
        { type: 'OPEN_PANEL', panel: 'viewMetadataPanel' }];

        const store = mockStore({});

        store.dispatch(actions.cancelTargetDocument());
        expect(store.getActions()).toEqual(expectedActions);
      });
    });
  });
});