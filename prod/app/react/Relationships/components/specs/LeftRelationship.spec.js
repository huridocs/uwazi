"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _Doc = _interopRequireDefault(require("../../../Library/components/Doc"));
var _DropdownList = _interopRequireDefault(require("../../../Forms/components/DropdownList"));

var _LeftRelationship = require("../LeftRelationship");
var _HubRelationshipMetadata = _interopRequireDefault(require("../HubRelationshipMetadata"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationshipsGraphEdit', () => {
  let component;
  let props;
  let hub;

  beforeEach(() => {
    hub = {
      hub: '1',
      leftRelationship: { entity: 'sharedId1', hub: 1, template: '123', entityData: { sharedId: 'sharedId1' } },
      rightRelationships: [
      {
        template: null,
        relationships: [
        { entity: 'sharedId2', hub: 1, template: null, entityData: { sharedId: 'sharedId2' } },
        { entity: 'sharedId4', hub: 1, template: null, entityData: { sharedId: 'sharedId4' } }] },


      {
        template: '456',
        relationships: [
        { entity: 'sharedId2', hub: 1, template: '456', entityData: { sharedId: 'sharedId2' } },
        { entity: 'sharedId3', hub: 1, template: '456', entityData: { sharedId: 'sharedId3' } }] }] };





    props = {
      index: 0,
      search: { sort: 'creationDate', order: 'desc', treatAs: 'number' },
      relationTypes: [{ _id: '123', name: 'Friend' }],
      parentEntity: (0, _immutable.fromJS)({ sharedId: 'sharedId1' }),
      hub: (0, _immutable.fromJS)(hub),
      editing: false,
      updateLeftRelationshipType: jasmine.createSpy('updateLeftRelationshipType'),
      toggelRemoveLeftRelationship: jasmine.createSpy('toggelRemoveLeftRelationship'),
      selectConnection: jasmine.createSpy('selectConnection') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_LeftRelationship.LeftRelationship, props));
  };

  describe('render()', () => {
    beforeEach(render);

    it('should render the relationship', () => {
      expect(component.find(_Doc.default).props().doc).toEqual((0, _immutable.fromJS)(props.parentEntity));
      expect(component.find(_HubRelationshipMetadata.default).props().relationship).toEqual((0, _immutable.fromJS)(hub.leftRelationship));
    });
  });

  describe('clicking in a relationship', () => {
    it('should select that connection', () => {
      render();
      component.find(_Doc.default).at(0).simulate('click');
      expect(props.selectConnection).toHaveBeenCalled();
    });
  });

  describe('while editing', () => {
    beforeEach(() => {
      props.editing = true;
      render();
    });

    describe('changing the template of a group', () => {
      it('should call updateLeftRelationshipType', () => {
        component.find(_DropdownList.default).at(0).simulate('change', { _id: 3 });
        expect(props.updateLeftRelationshipType).toHaveBeenCalledWith(0, { _id: 3 });
      });
    });
  });

  describe('when relationship is text range reference', () => {
    it('should render the Doc with the target reference', () => {
      hub.leftRelationship.range = { start: 100, end: 200 };
      props.hub = (0, _immutable.fromJS)(hub);
      render();
      expect(component).toMatchSnapshot();
    });
  });
});