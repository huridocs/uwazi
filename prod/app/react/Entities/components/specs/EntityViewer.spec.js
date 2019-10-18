"use strict";var _immutable = require("immutable");
var _react = _interopRequireDefault(require("react"));

var _ConnectionsList = require("../../../ConnectionsList");
var _enzyme = require("enzyme");

var _EntityViewer = require("../EntityViewer");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EntityViewer', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      entity: { title: 'Title' },
      templates: [
      { _id: 'template1', properties: [{ name: 'source_property', label: 'label1' }], name: 'template1Name' },
      { _id: 'template2', properties: [{ name: 'source_property', label: 'label2' }], name: 'template2Name' }],

      relationTypes: [{ _id: 'abc', name: 'relationTypeName' }],
      connectionsGroups: (0, _immutable.fromJS)([
      { key: 'g1', templates: [{ _id: 't1', count: 1 }] },
      { key: 'g2', templates: [{ _id: 't2', count: 2 }, { _id: 't3', count: 3 }] }]),

      deleteConnection: jasmine.createSpy('deleteConnection'),
      startNewConnection: jasmine.createSpy('startNewConnection') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_EntityViewer.EntityViewer, props), { context });
    instance = component.instance();
  };

  it('should render the ConnectionsGroups', () => {
    render();

    expect(component.find(_ConnectionsList.ConnectionsGroups).length).toBe(1);
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component.find(_ConnectionsList.ConnectionsList).props().deleteConnection({ sourceType: 'not metadata' });
    expect(context.confirm).toHaveBeenCalled();
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      instance.deleteConnection({});
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = { _id: 'r1' };
      instance.deleteConnection(ref);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = { _id: 'r1', sourceType: 'metadata' };
      instance.deleteConnection(ref);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });

  describe('closing side panel', () => {
    beforeEach(() => {
      render();
      component.find('.closeSidepanel').simulate('click');
      component.update();
    });
    it('should close the side panel when close button is clicked', () => {
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);
      expect(component.find('.entity-connections').prop('open')).toBe(false);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(true);
    });
    it('should reveal side panel when context menu is clicked', () => {
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);

      component.find('.show-info-sidepanel-menu').prop('openPanel')();
      component.update();

      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(true);
      expect(component.find('.entity-connections').prop('open')).toBe(true);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(false);
    });
  });
});