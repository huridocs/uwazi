"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _socket = _interopRequireDefault(require("../../../socket"));

var _SemanticSearchPanel = require("../SemanticSearchPanel");
var actions = _interopRequireWildcard(require("../../actions/actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('SemanticSearchPanel', () => {
  let initialState;
  let initialProps;
  let dispatch;
  beforeEach(() => {
    initialState = {
      library: {
        search: { filters: { prop1: { values: ['value1'] }, prop2: {} } },
        filters: _immutable.default.fromJS({
          documentTypes: ['type1'] }),

        ui: {
          selectedDocuments: [],
          showSemanticSearchPanel: true } },


      semanticSearch: {
        searches: _immutable.default.fromJS([]) } };


    initialProps = {
      storeKey: 'library' };

    jest.spyOn(actions, 'fetchSearches').mockResolvedValue([
    { searchTerm: 'search1' },
    { searchTerm: 'search2' }]);

    jest.spyOn(actions, 'submitNewSearch');
    jest.spyOn(actions, 'updateSearch').mockReturnValue();
    jest.spyOn(actions, 'hideSemanticSearch').mockReturnValue();
    jest.spyOn(actions, 'registerForUpdates').mockReturnValue();
    spyOn(_socket.default, 'on');
    spyOn(_socket.default, 'removeListener');
    dispatch = jest.fn();
  });

  const getProps = () => {
    const library = _objectSpread({},
    initialState.library, {
      ui: _immutable.default.fromJS(initialState.library.ui) });

    const state = _objectSpread({},
    initialState, {
      library });

    return _objectSpread({},
    (0, _SemanticSearchPanel.mapStateToProps)(state, initialProps), {},
    (0, _SemanticSearchPanel.mapDispatchToProps)(dispatch), {
      open: true });

  };
  const render = () => (0, _enzyme.shallow)(_react.default.createElement(_SemanticSearchPanel.SemanticSearchSidePanel, getProps()));

  describe('real time semantic search updates', () => {
    it('should set onSearchUpdated as listener for semantic search updates', () => {
      const component = render();
      expect(_socket.default.on).toHaveBeenCalledWith('semanticSearchUpdated', component.instance().onSearchUpdated);
    });

    it('should stop listening to updates when unmounted', () => {
      const component = render();
      component.instance().componentWillUnmount();
      expect(_socket.default.removeListener).toHaveBeenCalledWith('semanticSearchUpdated', component.instance().onSearchUpdated);
    });
  });

  it('should fetch all searches when mounted', done => {
    render();
    setImmediate(() => {
      expect(actions.fetchSearches).toHaveBeenCalled();
      done();
    });
  });

  it('should register for updates when mounted the first time', () => {
    const component = render();
    expect(actions.registerForUpdates).toHaveBeenCalled();
    actions.registerForUpdates.mockReset();
    component.update();
    expect(actions.registerForUpdates).not.toHaveBeenCalled();
  });

  it('should render SearchList with searches from the state', () => {
    initialState.semanticSearch.searches = _immutable.default.fromJS([
    { searchTerm: 'search1' },
    { searchTerm: 'search2' }]);

    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('onSearchUpdated', () => {
    it('should call updateSearch with updated search', () => {
      const event = { updatedSearch: 'search update' };
      const component = render();
      component.instance().onSearchUpdated(event);
      expect(actions.updateSearch).toHaveBeenCalledWith('search update');
    });
  });

  describe('close', () => {
    it('should hide semantic search panel', () => {
      const component = render();
      component.instance().close();
      expect(actions.hideSemanticSearch).toHaveBeenCalled();
    });
  });
});