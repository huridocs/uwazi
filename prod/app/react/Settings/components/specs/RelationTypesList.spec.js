"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _RelationTypesList = require("../RelationTypesList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('RelationTypesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      relationTypes: _immutable.default.fromJS([{ _id: 1, name: 'Against' }, { _id: 2, name: 'Supports' }]),
      notify: jasmine.createSpy('notify'),
      deleteRelationType: jasmine.createSpy('deleteRelationType').and.returnValue(Promise.resolve()),
      checkRelationTypeCanBeDeleted: jasmine.createSpy('checkRelationTypeCanBeDeleted').and.returnValue(Promise.resolve()) };


    context = {
      confirm: jasmine.createSpy('confirm') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_RelationTypesList.RelationTypesList, props), { context });
  };

  describe('render', () => {
    it('should a list with the document types', () => {
      render();
      expect(component.find('ul.relation-types').find('li').length).toBe(2);
    });
  });

  describe('when deleting a relation type', () => {
    it('should check if can be deleted', done => {
      render();
      component.instance().deleteRelationType({ _id: 1, name: 'Decision' }).
      then(() => {
        expect(props.checkRelationTypeCanBeDeleted).toHaveBeenCalled();
        done();
      });
    });

    it('should confirm the action', done => {
      render();
      component.instance().deleteRelationType({ _id: 1, name: 'Decision' }).
      then(() => {
        expect(context.confirm).toHaveBeenCalled();
        done();
      });
    });
  });
});