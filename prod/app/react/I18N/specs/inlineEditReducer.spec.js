"use strict";var _inlineEditReducer = _interopRequireDefault(require("../inlineEditReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('inlineEditReducer', () => {
  let initialState;
  beforeEach(() => {
    initialState = (0, _inlineEditReducer.default)();
  });

  describe('initialState', () => {
    it('should be as expected', () => {
      const expectedState = { inlineEdit: false, context: '', key: '', showInlineEditForm: false };
      expect(initialState.toJS()).toEqual(expectedState);
    });
  });

  describe('TOGGLE_INLINE_EDIT', () => {
    it('should toggle inlineEdit property', () => {
      const firstState = (0, _inlineEditReducer.default)(initialState, { type: 'TOGGLE_INLINE_EDIT' });
      const secondState = (0, _inlineEditReducer.default)(firstState, { type: 'TOGGLE_INLINE_EDIT' });
      expect(firstState.get('inlineEdit')).toBe(true);
      expect(secondState.get('inlineEdit')).toBe(false);
    });
  });

  describe('OPEN_INLINE_EDIT_FORM', () => {
    it('should set showInlineEditForm to true, and set the given context and key', () => {
      const state = (0, _inlineEditReducer.default)(initialState, { type: 'OPEN_INLINE_EDIT_FORM', context: 'System', key: 'Search' });
      expect(state.get('showInlineEditForm')).toBe(true);
      expect(state.get('context')).toBe('System');
      expect(state.get('key')).toBe('Search');
    });
  });

  describe('CLOSE_INLINE_EDIT_FORM', () => {
    it('should set showInlineEditForm to true', () => {
      initialState.set('showInlineEditForm', true);
      const state = (0, _inlineEditReducer.default)(initialState, { type: 'CLOSE_INLINE_EDIT_FORM' });
      expect(state.get('showInlineEditForm')).toBe(false);
    });
  });
});