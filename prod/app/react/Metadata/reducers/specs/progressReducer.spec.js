"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));

var _progressReducer = _interopRequireDefault(require("../progressReducer"));
require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('metadataReducer', () => {
  const initialState = _immutable.default.fromJS({});

  describe('when state is undefined', () => {
    it('should return default state', () => {
      const newState = (0, _progressReducer.default)();
      expect(newState).toEqual(initialState);
    });
  });

  describe('START_REUPLOAD_DOCUMENT', () => {
    it('should set the progress for the document to 0', () => {
      const currentState = _immutable.default.fromJS({ doc1: 45 });
      const newState = (0, _progressReducer.default)(currentState, { type: types.START_REUPLOAD_DOCUMENT, doc: 'doc2' });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ doc1: 45, doc2: 0 }));
    });
  });

  describe('REUPLOAD_PROGRESS', () => {
    it('should set the progress for a document', () => {
      const currentState = _immutable.default.fromJS({ doc1: 45 });
      const newState = (0, _progressReducer.default)(currentState, { type: types.REUPLOAD_PROGRESS, doc: 'doc2', progress: 36 });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ doc1: 45, doc2: 36 }));
    });
  });

  describe('REUPLOAD_COMPLETE', () => {
    it('should unset upload progress for the document', () => {
      const currentState = _immutable.default.fromJS({ doc1: 45, doc2: 55 });
      const newState = (0, _progressReducer.default)(currentState, { type: types.REUPLOAD_COMPLETE, doc: 'doc1' });
      expect(newState).toEqualImmutable(_immutable.default.fromJS({ doc2: 55 }));
    });
  });
});