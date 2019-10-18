"use strict";var _react = _interopRequireDefault(require("react"));

var _ImportProgress = require("../ImportProgress");
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ImportProgress', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      importState: { importStart: true, importProgress: 5, importError: _immutable.default.fromJS({}), importEnd: false },
      close: jasmine.createSpy('close') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ImportProgress.ImportProgress, props));
  };

  describe('rendering states', () => {
    it('should render a state for normal progress', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render a state for errors', () => {
      props.importState.importError = _immutable.default.fromJS({ message: 'Something bad happened' });
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render a state for end', () => {
      props.importState.importEnd = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });
});