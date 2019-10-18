"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _ConnectionsList = require("../ConnectionsList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ConnectionsList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      references: _immutable.default.fromJS([
      { _id: 'ref1', relationType: 'rel1', associatedRelationship: { entityData: { _id: '1' } }, range: { start: 10, end: 20 } },
      { _id: 'ref2', relationType: 'rel1', associatedRelationship: { entityData: { _id: '1' } }, range: { start: 0, end: 8 } },
      { _id: 'ref3', relationType: 'rel1', associatedRelationship: { entityData: { _id: '1' } }, range: { start: 5, end: 8 } },
      { _id: 'ref4', relationType: 'rel1', associatedRelationship: { entityData: { _id: '1' } }, range: { text: '' } }]),

      referencedDocuments: _immutable.default.fromJS([{ title: 'doc1', _id: '1' }, { title: 'doc2', _id: '2' }]),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      closePanel: jasmine.createSpy('closePanel') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ConnectionsList.ConnectionsList, props));
  };

  it('should merge and render references in order with the proper document titles', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when there are no references', () => {
    it('should render a blank state message', () => {
      props.references = _immutable.default.fromJS([]);
      render();
      expect(component).toMatchSnapshot();

      props.references = _immutable.default.fromJS([]);
      props.referencesSection = 'references';
      render();
      expect(component).toMatchSnapshot();
    });
  });
});