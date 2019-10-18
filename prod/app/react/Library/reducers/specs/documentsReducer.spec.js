"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));

var _documentsReducer = _interopRequireDefault(require("../documentsReducer"));
var actions = _interopRequireWildcard(require("../../actions/libraryActions"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('documentsReducer', () => {
  const initialState = _immutable.default.fromJS({ rows: [] });

  describe('when state is undefined', () => {
    it('returns initial', () => {
      const newState = (0, _documentsReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SET_DOCUMENTS', () => {
    it('should set the documents in the state', () => {
      const documents = [{ title: 'Song of Ice and Fire: The Winds of Winter' }, { title: 'Song of Ice and Fire: A Dream of Spring' }];
      const newState = (0, _documentsReducer.default)(initialState, { type: types.SET_DOCUMENTS, documents });

      expect(newState).toEqualImmutable(_immutable.default.fromJS(documents));
    });
  });

  describe('UNSET_DOCUMENTS', () => {
    it('should set the initial state', () => {
      const newState = (0, _documentsReducer.default)(_immutable.default.fromJS({ rows: [{}] }), actions.unsetDocuments());
      expect(newState).toEqual(initialState);
    });
  });

  describe('LIBRARY/UPDATE_DOCUMENT', () => {
    it('should set the documents in the state', () => {
      const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
      const newState = (0, _documentsReducer.default)(currentState, { type: types.UPDATE_DOCUMENT, doc: { _id: 2, title: 'new title' } });

      expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }, { title: 'new title', _id: 2 }] });
    });
  });

  describe('LIBRARY/UPDATE_DOCUMENTS', () => {
    it('should set the documents in the state', () => {
      const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
      const newState = (0, _documentsReducer.default)(currentState, {
        type: types.UPDATE_DOCUMENTS,
        docs: [{
          title: '1!',
          _id: 1 },
        {
          _id: 2,
          title: 'new title' }] });



      expect(newState.toJS()).toEqual({ rows: [{ title: '1!', _id: 1 }, { title: 'new title', _id: 2 }] });
    });
  });

  describe('REMOVE_DOCUMENT', () => {
    it('should remove the document from the state', () => {
      const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
      const newState = (0, _documentsReducer.default)(currentState, { type: types.REMOVE_DOCUMENT, doc: { title: '1', _id: 1 } });

      expect(newState.toJS()).toEqual({ rows: [{ title: '2', _id: 2 }] });
    });

    describe('when the document is not in the list', () => {
      it('should do nothing', () => {
        const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
        const newState = (0, _documentsReducer.default)(currentState, { type: types.REMOVE_DOCUMENT, doc: { title: '3', _id: 3 } });

        expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
      });
    });
  });

  describe('REMOVE_DOCUMENTS', () => {
    it('should remove the documents from the state', () => {
      const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }, { title: '3', _id: 3 }] });
      const newState = (0, _documentsReducer.default)(currentState, { type: types.REMOVE_DOCUMENTS, docs: [{ title: '2', _id: 2 }, { title: '3', _id: 3 }] });

      expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }] });
    });

    describe('when the document is not in the list', () => {
      it('should do nothing', () => {
        const currentState = _immutable.default.fromJS({ rows: [{ title: '1', _id: 1 }, { title: '2', _id: 2 }] });
        const newState = (0, _documentsReducer.default)(currentState, { type: types.REMOVE_DOCUMENTS, docs: [{ title: '2', _id: 2 }, { title: '3', _id: 3 }] });

        expect(newState.toJS()).toEqual({ rows: [{ title: '1', _id: 1 }] });
      });
    });
  });
});