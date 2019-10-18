"use strict";var _immutable = require("immutable");
var _react = _interopRequireDefault(require("react"));

var _I18N = require("../../../I18N");
var _enzyme = require("enzyme");

var _PagesList = require("../PagesList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PagesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      pages: (0, _immutable.fromJS)([
      { _id: 1, title: 'Page 1', sharedId: 'a1' },
      { _id: 2, title: 'Page 2', sharedId: 'a2' },
      { _id: 3, title: 'Page 3', sharedId: 'a3' }]),

      deletePage: jasmine.createSpy('deletePage').and.returnValue(Promise.resolve()) };


    context = {
      confirm: jasmine.createSpy('confirm') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_PagesList.PagesList, props), { context });
  };

  describe('render', () => {
    it('should render a list with all pages names', () => {
      render();
      expect(component.find('ul.pages').find('li').length).toBe(3);
      const nameLink = component.find('ul.pages').find('li').last().find(_I18N.I18NLink).first();
      expect(nameLink.props().to).toBe('/settings/pages/edit/a3');
      expect(nameLink.props().children).toBe('Page 3');
    });

    it('should have a button to add a page', () => {
      render();
      expect(component.find(_I18N.I18NLink).last().props().to).toBe('/settings/pages/new');
    });
  });

  describe('deletePage', () => {
    const page = (0, _immutable.Map)({ _id: 3, title: 'Judge', sharedId: 'a3' });
    beforeEach(() => {
      render();
      component.instance().deletePage(page);
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deletePage if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deletePage).toHaveBeenCalledWith(page.toJS());
    });
  });
});