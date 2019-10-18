"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _SidePanel = _interopRequireDefault(require("../../../Layout/SidePanel"));

var _UI = require("../../../UI");

var _CreateConnectionPanel = require("../CreateConnectionPanel");
var _SearchForm = _interopRequireDefault(require("../SearchForm"));
var _ActionButton = _interopRequireDefault(require("../ActionButton"));
var _SearchResults = _interopRequireDefault(require("../SearchResults"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('CreateConnectionPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connection: (0, _immutable.fromJS)({
        template: 'rt3',
        type: 'basic',
        sourceDocument: 'sourceId',
        targetDocument: 'targetId' }),

      pdfInfo: (0, _immutable.fromJS)([]),
      relationTypes: (0, _immutable.fromJS)([{ _id: 'rt1', name: 'relationType1' }, { _id: 'rt2', name: 'relationType2' }]),
      searchResults: (0, _immutable.fromJS)([{ _id: 'sr1' }, { _id: 'sr2' }]),
      uiState: (0, _immutable.fromJS)({ searching: true }),
      setRelationType: jasmine.createSpy('setRelationType'),
      setTargetDocument: () => {},
      onCreate: jasmine.createSpy('onCreate'),
      onRangedConnect: () => {} };

  });

  function render() {
    component = (0, _enzyme.shallow)(_react.default.createElement(_CreateConnectionPanel.CreateConnectionPanel, props));
  }

  it('should allow to select the connection types and set its value', () => {
    render();
    const options = component.find('.connections-list li');

    expect(options.at(0).text()).toContain('relationType1');
    expect(options.at(1).text()).toContain('relationType2');

    options.at(0).simulate('click');
    expect(props.setRelationType).toHaveBeenCalledWith('rt1');

    options.at(1).simulate('click');
    expect(props.setRelationType).toHaveBeenCalledWith('rt2');
  });

  it('should mark the connnection type passed', () => {
    props.connection = (0, _immutable.fromJS)({
      template: 'rt1',
      type: 'basic',
      sourceDocument: 'sourceId',
      targetDocument: 'targetId' });


    render();
    let options = component.find('.connections-list li');
    expect(options.at(0).find(_UI.Icon).props().icon).toBe('check');
    expect(options.at(1).find(_UI.Icon).props().icon).not.toBe('check');

    props.connection = (0, _immutable.fromJS)({
      template: 'rt2',
      type: 'basic',
      sourceDocument: 'sourceId',
      targetDocument: 'targetId' });


    render();
    options = component.find('.connections-list li');
    expect(options.at(0).find(_UI.Icon).props().icon).not.toBe('check');
    expect(options.at(1).find(_UI.Icon).props().icon).toBe('check');
  });

  it('should have a search form with the connection type', () => {
    render();
    expect(component.find(_SearchForm.default).props().connectionType).toBe('basic');
  });

  it('should have save button with an onCreate callback for most connection types', () => {
    render();
    const saveButton = component.find(_ActionButton.default).at(0);
    expect(saveButton.props().action).toBe('save');
    saveButton.props().onCreate();
    expect(props.onCreate).toHaveBeenCalled();
    expect(saveButton.parent().props().if).toBe(true);
    expect(component.find(_ActionButton.default).at(1).parent().props().if).toBe(false);
  });

  it('should have connect button with an onRangedConnect callback for targetRanged connections', () => {
    props.connection = props.connection.set('type', 'targetRanged');
    render();
    const connectButton = component.find(_ActionButton.default).at(1);
    expect(connectButton.props().action).toBe('connect');
    expect(connectButton.props().onRangedConnect).toBe(props.onRangedConnect);
    expect(connectButton.parent().props().if).toBe(true);
    expect(component.find(_ActionButton.default).at(0).parent().props().if).toBe(false);
  });

  it('should list the search results and pass props required', () => {
    render();
    const searchResults = component.find(_SearchResults.default);
    expect(searchResults.props().results).toBe(props.searchResults);
    expect(searchResults.props().searching).toBe(true);
    expect(searchResults.props().selected).toBe('targetId');
    expect(searchResults.props().onClick).toBe(props.setTargetDocument);
  });

  describe('Open behavior', () => {
    it('should stay closed if uiState open is false', () => {
      props.uiState = props.uiState.set('open', false);
      props.containerId = 'sourceId';
      render();
      expect(component.find(_SidePanel.default).props().open).toBe(false);
    });

    it('should stay closed if uiState open is true and the container is different from the connection source', () => {
      props.uiState = props.uiState.set('open', true);
      props.containerId = 'wrongMatch';
      render();
      expect(component.find(_SidePanel.default).props().open).toBe(false);
    });

    it('should only open if uiState open is true and the container matches the connection source', () => {
      props.uiState = props.uiState.set('open', true);
      props.containerId = 'sourceId';
      render();
      expect(component.find(_SidePanel.default).props().open).toBe(true);
    });
  });
});