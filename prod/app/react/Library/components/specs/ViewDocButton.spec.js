"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = require("immutable");
var _enzyme = require("enzyme");

var _BasicReducer = require("../../../BasicReducer");

var _ViewDocButton = require("../ViewDocButton");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ViewDocButton', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      type: 'entity',
      format: 'format',
      sharedId: '123',
      searchTerm: '',
      openReferencesTab: jest.fn() };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ViewDocButton.ViewDocButton, props));
    return component;
  };

  it('should render a view button poiting to the doc url with the searchTerm if pressent', () => {
    render();
    expect(component).toMatchSnapshot();

    props.searchTerm = 'something';
    render();
    expect(component).toMatchSnapshot();
  });
  describe('when targetReference is provided', () => {
    it('should render view button with reference id in the url query', () => {
      props.targetReference = (0, _immutable.fromJS)({ _id: 'ref1', range: { start: 200, end: 300 } });
      render();
      expect(component).toMatchSnapshot();

      props.searchTerm = 'something';
      render();
      expect(component).toMatchSnapshot();
    });
    it('should call openReferencesTab when clicked', () => {
      const event = { stopPropagation: jest.fn() };
      props.targetReference = (0, _immutable.fromJS)({ range: { start: 200, end: 300 } });
      render();
      component.simulate('click', event);
      expect(props.openReferencesTab).toHaveBeenCalled();
    });
  });

  describe('mapDispatchToProps', () => {
    describe('openReferencesTab', () => {
      it('should set the sidepanel tab to references', () => {
        const innerDispatch = jest.fn();
        const dispatch = jest.fn(fn => fn(innerDispatch));
        const mappedProps = (0, _ViewDocButton.mapDispatchToProps)(dispatch);
        mappedProps.openReferencesTab();
        expect(innerDispatch).toHaveBeenCalledWith(_BasicReducer.actions.set('viewer.sidepanel.tab', 'references'));
      });
    });
  });
});