"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../../I18N");
var _getFieldLabel = _interopRequireDefault(require("../getFieldLabel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('getFieldLabel', () => {
  let template;
  let field;
  beforeEach(() => {
    template = {
      _id: 'tpl1',
      commonProperties: [
      { name: 'creationDate', label: 'Date added' },
      { name: 'title', label: 'Name' }],

      properties: [
      {
        name: 'prop1',
        label: 'Prop 1' },

      {
        name: 'prop2',
        label: 'Prop 2' }] };



    field = 'metadata.prop2';
  });
  function runGetLabel() {
    return (0, _getFieldLabel.default)(field, template);
  }

  describe('if field has a metadata. prefix', () => {
    it('should return translated metadata field', () => {
      expect(runGetLabel()).toEqual((0, _I18N.t)(template._id, 'Prop 2'));
    });
  });

  describe('when field is title', () => {
    it('should return translated title label', () => {
      field = 'title';
      expect(runGetLabel()).toEqual((0, _I18N.t)(template._id, 'Name'));
    });
  });

  describe('when field is not in template', () => {
    it('should return the input field', () => {
      field = 'metadata.nonexistent';
      expect(runGetLabel()).toEqual('metadata.nonexistent');
      field = 'nonexistent';
      expect(runGetLabel()).toEqual('nonexistent');
    });
  });

  describe('when template is not defined', () => {
    it('should return the input field', () => {
      template = undefined;
      expect(runGetLabel()).toEqual('metadata.prop2');
    });
  });

  it('should work when template is an Immutable instance', () => {
    template = _immutable.default.fromJS(template);
    field = 'title';
    expect(runGetLabel()).toEqual('Name');
    field = 'metadata.prop1';
    expect(runGetLabel()).toEqual('Prop 1');
    field = 'nonexistent';
    expect(runGetLabel()).toEqual('nonexistent');
  });
});