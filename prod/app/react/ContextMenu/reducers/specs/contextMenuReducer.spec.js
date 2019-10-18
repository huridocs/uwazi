"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _contextMenuReducer = _interopRequireDefault(require("../contextMenuReducer"));
var types = _interopRequireWildcard(require("../../actions/actionTypes"));
var ViewerTypes = _interopRequireWildcard(require("../../../Viewer/actions/actionTypes"));
var UploadActions = _interopRequireWildcard(require("../../../Uploads/actions/actionTypes"));
var LibraryActions = _interopRequireWildcard(require("../../../Library/actions/actionTypes"));

require("jasmine-immutablejs-matchers");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('contextMenuReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      const newState = (0, _contextMenuReducer.default)();
      expect(newState).toEqual(_immutable.default.fromJS({ open: false, menu: null }));
    });
  });

  describe('OPEN_MENU', () => {
    it('should set open = true', () => {
      const currentState = _immutable.default.fromJS({ open: false });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: types.OPEN_MENU });
      const expected = _immutable.default.fromJS({ open: true });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('CLOSE_MENU', () => {
    it('should set open = false', () => {
      const currentState = _immutable.default.fromJS({ open: true });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: types.CLOSE_MENU });
      const expected = _immutable.default.fromJS({ open: false });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('SET_SELECTION', () => {
    it('should set type to ViewerTextSelectedMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.SET_SELECTION });
      const expected = _immutable.default.fromJS({ type: 'ViewerTextSelectedMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UNSET_SELECTION', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.UNSET_SELECTION });
      const expected = _immutable.default.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ADD_REFERENCE', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.ADD_REFERENCE });
      const expected = _immutable.default.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('LOAD_DEFAULT_VIEWER_MENU', () => {
    it('should set type to ViewerDefaultMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.LOAD_DEFAULT_VIEWER_MENU });
      const expected = _immutable.default.fromJS({ type: 'ViewerDefaultMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('OPEN_PANEL with viewMetadataPanel', () => {
    it('should set type to ViewMetadataMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.OPEN_PANEL, panel: 'viewMetadataPanel' });
      const expected = _immutable.default.fromJS({ type: 'MetadataPanelMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('OPEN_PANEL with referencePanel', () => {
    it('should set type to ViewerSaveReferenceMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.OPEN_PANEL, panel: 'referencePanel' });
      const expected = _immutable.default.fromJS({ type: 'ViewerSaveReferenceMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('OPEN_PANEL with targetReferencePanel', () => {
    it('should set type to ViewerSaveTargetReferenceMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: ViewerTypes.OPEN_PANEL, panel: 'targetReferencePanel' });
      const expected = _immutable.default.fromJS({ type: 'ViewerSaveTargetReferenceMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
  describe('ENTER_UPLOADS_SECTION', () => {
    it('should set type to UploadsMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: UploadActions.ENTER_UPLOADS_SECTION });
      const expected = _immutable.default.fromJS({ type: 'UploadsMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ENTER_LIBRARY', () => {
    it('should set type to LibraryMenu', () => {
      const currentState = _immutable.default.fromJS({ type: null });
      const newState = (0, _contextMenuReducer.default)(currentState, { type: LibraryActions.ENTER_LIBRARY });
      const expected = _immutable.default.fromJS({ type: 'LibraryMenu' });

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });
});