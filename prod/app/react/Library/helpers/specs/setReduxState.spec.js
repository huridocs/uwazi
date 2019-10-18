"use strict";var actionTypes = _interopRequireWildcard(require("../../actions/actionTypes"));
var libraryActions = _interopRequireWildcard(require("../../actions/libraryActions"));
var _setReduxState = _interopRequireDefault(require("../setReduxState"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('setReduxState()', () => {
  const aggregations = { buckets: [] };
  const documents = { rows: [{ title: 'Something to publish' }, { title: 'My best recipes' }], totalRows: 2, aggregations };
  const dispatchCallsOrder = [];
  let context;

  beforeEach(() => {
    spyOn(libraryActions, 'setTemplates');
    context = { store: { dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }) } };
    const state = { library: { documents, aggregations, filters: { documentTypes: 'types', properties: 'properties' } } };
    (0, _setReduxState.default)(state)(context.store.dispatch);
  });

  it('should set the documents and aggregations and Unset the documents as first action', () => {
    expect(dispatchCallsOrder[1]).toBe(actionTypes.UNSET_DOCUMENTS);
    expect(context.store.dispatch).toHaveBeenCalledWith({ type: actionTypes.UNSET_DOCUMENTS, __reducerKey: 'library' });
    expect(context.store.dispatch).toHaveBeenCalledWith({ type: actionTypes.SET_DOCUMENTS, documents, __reducerKey: 'library' });
    expect(context.store.dispatch).toHaveBeenCalledWith({
      type: actionTypes.INITIALIZE_FILTERS_FORM,
      documentTypes: 'types',
      libraryFilters: 'properties',
      aggregations,
      __reducerKey: 'library' });

  });
});