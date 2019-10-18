"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _ConnectionsGroups = require("../ConnectionsGroups");
var _ConnectionsGroup = _interopRequireDefault(require("../ConnectionsGroup"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConnectionsGroups', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connectionsGroups: (0, _immutable.fromJS)([
      { key: 'g1', templates: [{ _id: 't1', count: 1 }] },
      { key: 'g2', templates: [{ _id: 't2', count: 2 }, { _id: 't3', count: 3 }] }]) };


  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ConnectionsGroups.ConnectionsGroups, props));
  };

  describe('when there are connectionsGroups', () => {
    it('should render each individual ConnectionsGroup', () => {
      render();

      const ref1 = component.find(_ConnectionsGroup.default).at(0);
      const ref2 = component.find(_ConnectionsGroup.default).at(1);

      expect(ref1.props().group).toBe(props.connectionsGroups.get(0));
      expect(ref2.props().group).toBe(props.connectionsGroups.get(1));
    });
  });

  describe('when there are no connectionsGroups', () => {
    it('should render each individual ConnectionsGroup', () => {
      props.connectionsGroups = (0, _immutable.fromJS)([]);
      render();

      expect(component.find(_ConnectionsGroup.default).length).toBe(0);
      expect(component.find('div.blank-state').length).toBe(1);
    });
  });
});