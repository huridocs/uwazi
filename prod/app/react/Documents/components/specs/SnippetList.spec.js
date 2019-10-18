"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _immutable = _interopRequireDefault(require("immutable"));
var _SnippetList = require("../SnippetList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SnippetList.SnippetList, props));
  };

  beforeEach(() => {
    props = {
      doc: _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      selectSnippet: jest.fn(),
      selectedSnippet: _immutable.default.fromJS({ text: 'first <b>snippet 1</b> found', page: 1 }),
      snippets: _immutable.default.fromJS({
        metadata: [
        {
          field: 'title',
          texts: [
          'metadata <b>snippet m1</b> found'] },


        {
          field: 'metadata.summary',
          texts: [
          'metadata <b>snippet m2</b>'] }],



        fullText: [
        { text: 'first <b>snippet 1</b> found', page: 1 },
        { text: 'second <b>snippet 3</b> found', page: 2 },
        { text: 'third <b>snippet 3</b> found', page: 3 }] }),


      template: _immutable.default.fromJS({
        _id: 'template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        {
          name: 'summary',
          label: 'Summary' }] }) };




  });

  it('should render metadata snippets and document content snippets components ', () => {
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
  it('should render only metadata snippets if there are no document snippets', () => {
    props.snippets = props.snippets.set('fullText', _immutable.default.fromJS([]));
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
  it('should render only document snippets if there are no metadata snippets', () => {
    props.snippets = props.snippets.set('metadata', _immutable.default.fromJS([]));
    render();
    const snippets = component.find('.snippet-list');
    expect(snippets).toMatchSnapshot();
  });
});