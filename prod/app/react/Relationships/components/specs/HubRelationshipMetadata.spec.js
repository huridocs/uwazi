"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _HubRelationshipMetadata = _interopRequireWildcard(require("../HubRelationshipMetadata"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('HubRelationshipMetadata', () => {
  let props;
  let template;
  let range;
  let metadata;

  beforeEach(() => {
    template = 't1';

    const relationTypes = (0, _immutable.fromJS)([{
      _id: 't1',
      properties: [
      { name: 'propertyA', label: 'labelA' },
      { name: 'propertyB', label: 'labelB' },
      { name: 'propertyC', label: 'labelC' }] }]);



    const thesauris = (0, _immutable.fromJS)([{ _id: 'Value A' }, { _id: 'Value B' }]);

    props = Object.assign(
    (0, _HubRelationshipMetadata.mapStateToProps)({ relationTypes, thesauris }),
    { relationship: (0, _immutable.fromJS)({ template }) });


    range = { text: 'Some quoted text' };
    metadata = { propertyA: 'Value B', propertyB: 'Value B', propertyC: [{ value: 'Value C1' }, { value: 'Value C2' }] };
  });

  function testSnapshot() {
    const component = (0, _enzyme.shallow)(_react.default.createElement(_HubRelationshipMetadata.default.WrappedComponent, props));
    expect(component).toMatchSnapshot();
  }


  it('should render null if relationship lacks metadata or text', () => {
    testSnapshot();
  });

  it('should render the text quote correctly', () => {
    props.relationship = (0, _immutable.fromJS)({ range });
    testSnapshot();
  });

  it('should render the metadata correctly', () => {
    props.relationship = (0, _immutable.fromJS)({ template, metadata });
    testSnapshot();
  });

  it('should render the metadata correctly when text is also present', () => {
    props.relationship = (0, _immutable.fromJS)({ template, range, metadata });
    testSnapshot();
  });
});