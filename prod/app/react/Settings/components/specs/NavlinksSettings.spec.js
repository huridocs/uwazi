"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _reactReduxForm = require("react-redux-form");
var _NavlinksSettings = _interopRequireWildcard(require("../NavlinksSettings"));

var _NavlinkForm = _interopRequireDefault(require("../NavlinkForm"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('NavlinksSettings', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      collection: (0, _immutable.fromJS)({ _id: 'abc', _rev: 'xyz', name: 'name', links: [{ localID: 'existingLink' }] }),
      links: [{ localID: 'newLink1' }, { localID: 'newLink2' }],
      loadLinks: jasmine.createSpy('loadLinks'),
      addLink: jasmine.createSpy('addLink'),
      sortLink: jasmine.createSpy('sortLink'),
      saveLinks: jasmine.createSpy('saveLinks') };

    component = (0, _enzyme.shallow)(_react.default.createElement(_NavlinksSettings.NavlinksSettings, props));
  });

  describe('componentWillMount', () => {
    it('should call on loadLinks with collection links', () => {
      expect(props.loadLinks).toHaveBeenCalledWith([{ localID: 'existingLink' }]);
    });
  });

  it('should render a Form linked to settings.navlinksData and validated', () => {
    expect(component.find(_reactReduxForm.Form).props().model).toBe('settings.navlinksData');
    expect(Object.keys(component.find(_reactReduxForm.Form).props().validators['']).length).toBe(2);
  });

  it('should save links upon submit', () => {
    component.find(_reactReduxForm.Form).props().onSubmit();
    expect(props.saveLinks).toHaveBeenCalledWith({ _id: 'abc', _rev: 'xyz', links: props.links });
  });

  it('should disable saving if savingNavlinks', () => {
    props.savingNavlinks = true;
    component = (0, _enzyme.shallow)(_react.default.createElement(_NavlinksSettings.NavlinksSettings, props));
    expect(component.find('button').first().props().disabled).toBe(true);
  });

  it('should list all existing links', () => {
    expect(component.find(_NavlinkForm.default).length).toBe(2);
    expect(component.find(_NavlinkForm.default).first().props().link).toBe(props.links[0]);
    expect(component.find(_NavlinkForm.default).last().props().link).toBe(props.links[1]);
    expect(component.find(_NavlinkForm.default).first().props().sortLink).toBe(props.sortLink);
  });

  it('should have an add button that calls on addLink with links', () => {
    component.find('a.btn-primary').props().onClick();
    expect(props.addLink).toHaveBeenCalledWith(props.links);
  });

  describe('mapStateToProps', () => {
    const settings = {
      collection: (0, _immutable.fromJS)({ id: 'collection' }),
      navlinksData: { links: [{ localID: 'existingLink' }] },
      uiState: (0, _immutable.fromJS)({ savingNavlinks: true }) };


    it('should return the right props', () => {
      expect((0, _NavlinksSettings.mapStateToProps)({ settings }).links).toBe(settings.navlinksData.links);
      expect((0, _NavlinksSettings.mapStateToProps)({ settings }).collection).toBe(settings.collection);
      expect((0, _NavlinksSettings.mapStateToProps)({ settings }).savingNavlinks).toBe(true);
    });
  });

  describe('Drag and Drop functionality', () => {
    beforeEach(() => {
      props.store = {
        subscribe: jasmine.createSpy('subscribe'),
        dispatch: jasmine.createSpy('dispatch'),
        getState: jasmine.createSpy('getState').and.returnValue({
          settings: { collection: props.collection, navlinksData: { links: [] }, uiState: { get: jasmine.createSpy('get') } } }) };

    });

    it('should decorate the component as a Drag and Drop context', () => {
      expect(new _NavlinksSettings.default().constructor.name).toBe('DragDropContextContainer');
    });
  });
});