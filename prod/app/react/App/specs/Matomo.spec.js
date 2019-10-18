"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _Matomo = require("../Matomo");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Matomo', () => {
  let props;
  beforeEach(() => {
    props = {
      url: 'url/',
      id: 'id' };

  });

  it('should include matomo script when url and id are set', () => {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Matomo.Matomo, props));
    expect(component).toMatchSnapshot();
  });

  it('should add "/" at the end of url when not set', () => {
    props.url = 'url';
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Matomo.Matomo, props));
    expect(component).toMatchSnapshot();
  });

  it('should not include script when id or url are not set', () => {
    props = {};
    const component = (0, _enzyme.shallow)(_react.default.createElement(_Matomo.Matomo, props));
    expect(component).toMatchSnapshot();
  });

  describe('mapStateToProps', () => {
    it('should parse and map id and url', () => {
      const state = { settings: { collection: _immutable.default.fromJS({ matomoConfig: '{"id":"id", "url": "url"}' }) } };
      expect((0, _Matomo.mapStateToProps)(state)).toEqual({ id: 'id', url: 'url' });
    });

    it('should not fail when json is malformed', () => {
      const state = { settings: { collection: _immutable.default.fromJS({ matomoConfig: '{\'id\':"id", "url": "url"}' }) } };
      expect((0, _Matomo.mapStateToProps)(state)).toEqual({});
    });
  });
});