"use strict";var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _SourceDocument = _interopRequireDefault(require("../SourceDocument"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('SourceDocument', () => {
  let component;
  let store;
  const mockStore = (0, _reduxMockStore.default)([]);

  const state = {
    user: _immutable.default.fromJS({ _id: 1 }),
    documentViewer: {
      sidepanel: {
        snippets: _immutable.default.fromJS([]) },

      uiState: _immutable.default.fromJS({
        reference: { sourceRange: { selection: 'selection' } },
        highlightedReference: 'highlightedReference' }),

      doc: _immutable.default.fromJS({ sharedId: 'docSharedId', name: 'document' }),
      targetDoc: _immutable.default.fromJS({}),
      references: _immutable.default.fromJS([
      { _id: 'r1', entity: 'docSharedId', range: { start: 0 }, reference: 'reference', hub: 'hub1' },
      { _id: 'r2', entity: 'docSharedId', reference: 'should not generate a reference, its not text based', hub: 'hub2' },
      { _id: 'r3', entity: 'id1', reference: 'should be excluded', hub: 'hub2' },
      { _id: 'r4', entity: 'id2', reference: 'should be associated', hub: 'hub1' },
      { _id: 'r5', entity: 'id3', reference: 'should also be associated', hub: 'hub1' }]) } };




  const render = () => {
    store = mockStore(state);
    component = (0, _enzyme.shallow)(_jsx(_SourceDocument.default, {}), { context: { store } });
  };

  it('should map props', () => {
    render();
    const props = component.props();
    expect(props.selection).toEqual({ selection: 'selection' });
    expect(props.doc.get('name')).toBe('document');
    expect(props.references.toJS()).toEqual([
    {
      _id: 'r1',
      entity: 'docSharedId',
      range: { start: 0 },
      reference: 'reference',
      hub: 'hub1',
      associatedRelationship: { _id: 'r4', entity: 'id2', reference: 'should be associated', hub: 'hub1' } },

    {
      _id: 'r1',
      entity: 'docSharedId',
      range: { start: 0 },
      reference: 'reference',
      hub: 'hub1',
      associatedRelationship: { _id: 'r5', entity: 'id3', reference: 'should also be associated', hub: 'hub1' } }]);


    expect(props.className).toBe('sourceDocument');
    expect(props.executeOnClickHandler).toBe(false);
  });

  it('should forceSimulateSelection when showing panels referencePanel or targetReferencePanel', () => {
    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'referencePanel');
    render();
    let props = component.props();
    expect(props.forceSimulateSelection).toBe(true);

    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'targetReferencePanel');
    render();
    props = component.props();
    expect(props.forceSimulateSelection).toBe(true);

    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'otherPanel');
    render();
    props = component.props();
    expect(props.forceSimulateSelection).toBe(false);
  });

  it('should pass executeOnClickHandler true if target document is loaded', () => {
    state.documentViewer.targetDoc = _immutable.default.fromJS({ _id: 'id' });
    render();

    const props = component.props();
    expect(props.executeOnClickHandler).toBe(true);
  });
});