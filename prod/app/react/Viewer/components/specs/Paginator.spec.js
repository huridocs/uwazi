"use strict";var _Layout = require("../../../Layout");
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _Paginator = _interopRequireDefault(require("../Paginator"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Paginator', () => {
  it('should render a previous button and next button based on the current page and total pages', () => {
    const props = {
      page: 5,
      totalPages: 25,
      baseUrl: 'url' };


    const component = (0, _enzyme.shallow)(_react.default.createElement(_Paginator.default, props));
    expect(component).toMatchSnapshot();
  });

  describe('when base Url already has the query string "?"', () => {
    it('should add the page number properly to the query string', () => {
      const props = {
        page: 3,
        totalPages: 25,
        baseUrl: 'url?param=value' };


      const component = (0, _enzyme.shallow)(_react.default.createElement(_Paginator.default, props));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on first page', () => {
    it('should disable the prev link', () => {
      const props = {
        page: 1,
        totalPages: 25,
        baseUrl: 'url' };


      const component = (0, _enzyme.shallow)(_react.default.createElement(_Paginator.default, props));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when on last page', () => {
    it('should disable the next link', () => {
      const props = {
        page: 25,
        totalPages: 25,
        baseUrl: 'url' };


      const component = (0, _enzyme.shallow)(_react.default.createElement(_Paginator.default, props));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when passing onPageChange callback', () => {
    it('should execute callback on prev/next passing the page selecte', () => {
      const props = {
        page: 5,
        totalPages: 25,
        baseUrl: 'url',
        onPageChange: jasmine.createSpy('onPageChange') };


      const component = (0, _enzyme.shallow)(_react.default.createElement(_Paginator.default, props));

      component.find(_Layout.CurrentLocationLink).at(0).simulate('click', { preventDefault: () => {} });
      expect(props.onPageChange).toHaveBeenCalledWith(4);

      component.find(_Layout.CurrentLocationLink).at(1).simulate('click', { preventDefault: () => {} });
      expect(props.onPageChange).toHaveBeenCalledWith(6);
    });
  });
});