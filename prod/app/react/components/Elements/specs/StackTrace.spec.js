"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _UI = require("../../../UI");

var _StackTrace = _interopRequireDefault(require("../StackTrace.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('StackTrace', () => {
  let component;
  const props = { message:
    'ValidationError: title: Path `title` is required. at new ValidationError ' +
    '(/Users/user/Sites/uwazi/node_modules/mongoose/lib /error/validation.js:27:11) ' +
    'at model.Document.invalidate (/Users/user/Sites/uwazi/node_modules/mongoose /lib/document.js:1775:32) at ' +
    '/Users/user/Sites/uwazi/node_modules/mongoose/lib/document.js:1647:17 ' +
    'at /Users/user/Sites/uwazi/node_modules/mongoose/lib/schematype.js:808:9 at _combinedTickCallback ' +
    '(internal/process/next_tick.js:131:7) at process._tickCallback (internal/process/next_tick.js:180:9)' };


  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_StackTrace.default, props));
  };

  it('should display a shortened message', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('expanded', () => {
    it('should display the full message', () => {
      render();
      component.find(_UI.Icon).simulate('click');
      expect(component).toMatchSnapshot();
    });
  });
});