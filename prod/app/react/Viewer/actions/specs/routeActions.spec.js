"use strict";var _config = require("../../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var relationships = _interopRequireWildcard(require("../../../Relationships/utils/routeUtils"));

var routeActions = _interopRequireWildcard(require("../routeActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Viewer routeActions', () => {
  const document = { _id: '1', sharedId: 'sid', title: 'title', pdfInfo: 'test' };
  const relationTypes = { rows: [{ name: 'Supports', _id: '1' }] };
  const references = [{ _id: '1', connectedDocument: '1' }, { _id: '2', connectedDocument: '2' }];

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}entities?sharedId=documentId`, { body: JSON.stringify({ rows: [document] }) }).
    get(`${_config.APIURL}relationtypes`, { body: JSON.stringify(relationTypes) }).
    get(`${_config.APIURL}references/by_document?sharedId=documentId`, { body: JSON.stringify(references) });

    spyOn(relationships, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults', 'sort']));
  });

  afterEach(() => _fetchMock.default.restore());

  describe('setViewerState()', () => {
    let dispatch;
    let state;

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      spyOn(relationships, 'setReduxState').and.callFake(argState => ({ type: 'relationshipsSetReduxState', value: argState }));

      state = {
        documentViewer:
        {
          doc: 'doc',
          references: 'references',
          templates: 'templates',
          thesauris: 'thesauris',
          relationTypes: 'relationTypes',
          rawText: 'rawText' },

        relationTypes: 'relationTypes' };


      routeActions.setViewerState(state)(dispatch);
    });

    it('should call setTemplates with templates passed', () => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationTypes/SET', value: 'relationTypes' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: 'references' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/SET', value: 'doc' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/relationTypes/SET', value: 'relationTypes' });
      expect(dispatch).toHaveBeenCalledWith({ type: 'relationshipsSetReduxState', value: state });
      expect(dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/SET', value: 'rawText' });
    });
  });
});