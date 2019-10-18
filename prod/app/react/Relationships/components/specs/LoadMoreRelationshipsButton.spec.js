"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _LoadMoreRelationshipsButton = require("../LoadMoreRelationshipsButton");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('LoadMoreRelationshipsButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      totalHubs: 4,
      requestedHubs: 4,
      action: jasmine.createSpy('action'),
      loadMoreAmmount: 2 };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_LoadMoreRelationshipsButton.LoadMoreRelationshipsButton, props));
  };

  it('should not render a button when all hubs loaded', () => {
    render();
    expect(component.find('button').length).toBe(0);
  });

  describe('Load More button', () => {
    beforeEach(() => {
      props.requestedHubs = 3;
      render();
    });

    it('should render a button when partial loaded hubs', () => {
      expect(component.find('button').length).toBe(1);
      expect(component.find('button').text()).toBe('2 x more');
    });

    it('should call on the passed function upon click with previously requestedHubs', () => {
      const button = component.find('button');
      button.simulate('click');
      expect(props.action).toHaveBeenCalledWith(5);
    });
  });

  describe('mapStateToProps', () => {
    it('should map the relationships list search results', () => {
      const state = { relationships: { list: {
            searchResults: (0, _immutable.fromJS)({ totalHubs: 'totalHubs', requestedHubs: 'requestedHubs' }) } } };


      expect((0, _LoadMoreRelationshipsButton.mapStateToProps)(state)).toEqual({ totalHubs: 'totalHubs', requestedHubs: 'requestedHubs', loadMoreAmmount: 10 });
    });
  });
});