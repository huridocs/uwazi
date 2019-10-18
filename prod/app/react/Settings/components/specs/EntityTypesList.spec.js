"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _EntityTypesList = require("../EntityTypesList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EntityTypesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      templates: _immutable.default.fromJS([
      { _id: 1, name: 'Decision' },
      { _id: 2, name: 'Ruling' },
      { _id: 3, name: 'Judge', isEntity: true }]),

      notify: jasmine.createSpy('notify'),
      deleteTemplate: jasmine.createSpy('deleteTemplate').and.returnValue(Promise.resolve()),
      setAsDefault: jasmine.createSpy('setAsDefault').and.returnValue(Promise.resolve()),
      checkTemplateCanBeDeleted: jasmine.createSpy('checkTemplateCanBeDeleted').and.returnValue(Promise.resolve()) };


    context = {
      confirm: jasmine.createSpy('confirm') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_EntityTypesList.EntityTypesList, props), { context });
  };

  describe('when deleting a document type', () => {
    it('should check if can be deleted', done => {
      render();
      component.instance().deleteTemplate({ _id: 3, name: 'Judge' }).
      then(() => {
        expect(props.checkTemplateCanBeDeleted).toHaveBeenCalled();
        done();
      });
    });

    it('should confirm the action', done => {
      render();
      component.instance().deleteTemplate({ _id: 3, name: 'Judge' }).
      then(() => {
        expect(context.confirm).toHaveBeenCalled();
        done();
      });
    });
  });
});