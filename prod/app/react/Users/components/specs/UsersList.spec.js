"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _I18N = require("../../../I18N");
var _UsersList = require("../UsersList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('UsersList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      users: (0, _immutable.fromJS)([
      { _id: 1, username: 'User 1', sharedId: 'a1' },
      { _id: 2, username: 'User 2', sharedId: 'a2' },
      { _id: 3, username: 'User 3', sharedId: 'a3' }]),

      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(Promise.resolve()) };


    context = {
      confirm: jasmine.createSpy('confirm') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_UsersList.UsersList, props), { context });
  };

  describe('render', () => {
    it('should render a list with all users names', () => {
      render();
      expect(component.find('ul.users').find('li').length).toBe(3);
      const span = component.find('ul.users').find('li').last().find('span').first();
      expect(span.props().children).toBe('User 3');
    });

    it('should have a button to add a page', () => {
      render();
      expect(component.find(_I18N.I18NLink).last().props().to).toBe('/settings/users/new');
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      render();
      component.instance().deleteUser((0, _immutable.Map)({ _id: 3, title: 'Judge', sharedId: 'a3' }));
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deleteUser if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteUser).toHaveBeenCalledWith({ _id: 3, sharedId: 'a3' });
    });
  });
});