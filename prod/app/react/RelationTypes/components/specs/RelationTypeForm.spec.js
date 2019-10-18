"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _RelationTypeForm = require("../RelationTypeForm.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationTypeForm', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      relationType: { name: 'test' },
      relationTypes: _immutable.default.fromJS([]),
      resetForm: jasmine.createSpy('resetForm'),
      setInitial: jasmine.createSpy('setInitial'),
      handleSubmit: jasmine.createSpy('handleSubmit'),
      state: { fields: [] } };


    component = (0, _enzyme.shallow)(_react.default.createElement(_RelationTypeForm.RelationTypeForm, props));
  });

  describe('when unmount', () => {
    it('shoould reset the form', () => {
      component.unmount();
      expect(props.resetForm).toHaveBeenCalled();
      expect(props.setInitial).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        relationType: _immutable.default.fromJS({ name: 'relationType name' }) };

    });

    it('should map the relationType', () => {
      expect((0, _RelationTypeForm.mapStateToProps)(state).relationType.toJS()).toEqual({ name: 'relationType name' });
    });
  });
});