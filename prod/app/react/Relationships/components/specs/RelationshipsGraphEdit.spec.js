"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _RelationshipsGraphEdit = require("../RelationshipsGraphEdit");
var _LeftRelationship = _interopRequireDefault(require("../LeftRelationship"));
var _RightRelationship = _interopRequireDefault(require("../RightRelationship"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationshipsGraphEdit', () => {
  let component;
  let props;
  let hubs;

  beforeEach(() => {
    hubs = [
    {
      hub: '1',
      leftRelationship: { entity: 'sharedId1', hub: 1, template: '123' },
      rightRelationships: [
      {
        template: null,
        relationships: [
        { entity: 'sharedId2', hub: 1, template: null },
        { entity: 'sharedId3', hub: 1, template: null }] },


      {
        template: '456',
        relationships: [
        { entity: 'sharedId2', hub: 1, template: '456' },
        { entity: 'sharedId3', hub: 1, template: '456' }] }] },




    {
      hub: '2',
      leftRelationship: { entity: 'sharedId1', hub: '2', template: '123' },
      rightRelationships: [
      {
        template: '789',
        relationships: [
        { entity: 'sharedId2', hub: '2', template: '789' },
        { entity: 'sharedId4', hub: '2', template: '789' }] }] }];






    props = {
      parentEntity: (0, _immutable.fromJS)({}),
      hubs: (0, _immutable.fromJS)(hubs),
      editing: false,
      searchResults: (0, _immutable.fromJS)({ rows: [] }),
      parseResults: jasmine.createSpy('parseResults'),
      addHub: jasmine.createSpy('addHub') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_RelationshipsGraphEdit.RelationshipsGraphEdit, props));
  };

  it('should render a LeftRelationship component for each hub', () => {
    render();
    const leftRelationshipComponents = component.find(_LeftRelationship.default);
    expect(leftRelationshipComponents.length).toBe(2);
    expect(leftRelationshipComponents.at(0).props().index).toBe(0);
    expect(leftRelationshipComponents.at(0).props().hub).toEqual((0, _immutable.fromJS)(hubs[0]));
    expect(leftRelationshipComponents.at(1).props().hub).toEqual((0, _immutable.fromJS)(hubs[1]));
  });

  it('should render a RightRelationship component for each hub', () => {
    render();
    const rightRelationshipComponents = component.find(_RightRelationship.default);
    expect(rightRelationshipComponents.length).toBe(2);
    expect(rightRelationshipComponents.at(0).props().index).toBe(0);
    expect(rightRelationshipComponents.at(0).props().hub).toEqual((0, _immutable.fromJS)(hubs[0]));
    expect(rightRelationshipComponents.at(1).props().hub).toEqual((0, _immutable.fromJS)(hubs[1]));
  });

  describe('when editing', () => {
    it('should render a buttong to add a hub', () => {
      props.editing = true;
      render();
      component.find('.relationships-new').simulate('click');
      expect(props.addHub).toHaveBeenCalled();
    });
  });

  describe('componentWillMount', () => {
    it('should call parseResults', () => {
      render();
      const instance = component.instance();
      instance.componentWillMount();
      expect(props.parseResults).toHaveBeenCalledWith(props.searchResults, props.parentEntity, props.editing);
    });
  });

  describe('componentWillUpdate', () => {
    it('should call parseResults when searchResults changed', () => {
      render();
      const instance = component.instance();
      props.parseResults.calls.reset();
      instance.componentWillUpdate(props);
      expect(props.parseResults).not.toHaveBeenCalled();
      props.searchResults = (0, _immutable.fromJS)({ rows: [] });
      instance.componentWillUpdate(props);
      expect(props.parseResults).toHaveBeenCalledWith(props.searchResults, props.parentEntity, props.editing);
    });
  });
});