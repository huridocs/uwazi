"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _immutable = _interopRequireDefault(require("immutable"));
var _SnippetList = require("../SnippetList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SnippetList.MetadataFieldSnippets, props));
  };

  beforeEach(() => {
    props = {
      doc: _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      fieldSnippets: _immutable.default.fromJS({
        field: 'metadata.summary',
        texts: [
        'metadata <b>snippet m1</b> found',
        'metadata <b>snippet m2</b> found'] }),


      template: _immutable.default.fromJS({
        _id: 'template',
        properties: [
        { name: 'summary', label: 'Summary' }] }) };



  });

  it('should render all metadata snippets with the field label as heading', () => {
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });
  it('should properly render title snippets with Title label as heading', () => {
    props.fieldSnippets = _immutable.default.fromJS(_immutable.default.fromJS({
      field: 'metadata.summary',
      texts: [
      'title <b>snippet m1</b> found',
      'title <b>snippet m2</b> found'] }));


    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });
});