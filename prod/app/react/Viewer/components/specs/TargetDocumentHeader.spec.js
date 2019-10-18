"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _TargetDocumentHeader = require("../TargetDocumentHeader.js");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('TargetDocumentHeader', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connection: (0, _immutable.fromJS)({ _id: 'connection' }),
      reference: { targetRange: { text: 'text' }, targetDocument: 'abc2' },
      targetDocument: 'abc2',
      saveTargetRangedReference: jasmine.createSpy('saveTargetRangedReference'),
      cancelTargetDocument: jasmine.createSpy('cancelTargetDocument'),
      addReference: () => {} };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_TargetDocumentHeader.TargetDocumentHeader, props));
  };

  describe('back button', () => {
    it('should cancelTargetDocument', () => {
      render();
      component.find('button').first().simulate('click');
      expect(props.cancelTargetDocument).toHaveBeenCalled();
    });
  });

  describe('save button', () => {
    it('should save the reference', () => {
      render();
      component.find('button').last().simulate('click');
      expect(props.saveTargetRangedReference).toHaveBeenCalledWith({ _id: 'connection' }, { text: 'text' }, jasmine.any(Function));
    });
  });
});