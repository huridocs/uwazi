"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _ItemSnippet = require("../ItemSnippet");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ItemSnippet', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: {},
      snippets: {
        count: 0,
        metadata: [
        {
          field: 'title',
          texts: [
          'title 1 <b>snippet</b> found',
          'title 2 <b>snippet</b> found'] },


        {
          field: 'metadata.summary',
          texts: [
          'metadata 1 <b>snippet</b> found',
          'metadata 2 <b>snippet</b> found'] }],



        fullText: [
        { text: 'doc <b>snippet</b> found', page: 1 },
        { text: 'other doc <b>snippet</b> found', page: 2 }] },


      onSnippetClick: jest.fn(),
      template: _immutable.default.fromJS({
        _id: 'template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        {
          name: 'summary',
          label: 'Summary' }] }) };




  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ItemSnippet.ItemSnippet, props));
  };

  it('should first metadata snippet if exists', () => {
    render();
    expect(component).toMatchSnapshot();
  });
  it('should first metadata snippet when there are no document content snippets', () => {
    render();
    expect(component).toMatchSnapshot();
  });
  it('should first title snippet if metadata only has title snippets', () => {
    props.snippets.metadata = [
    {
      field: 'title',
      texts: [
      'title 1 <b>snippet</b> found'] }];



    render();
    expect(component).toMatchSnapshot();
  });
  it('should first metadata snippet if metadata only has metadata field snippets', () => {
    props.snippets.metadata = [
    {
      field: 'metadata.summary',
      texts: [
      'metadata 1 <b>snippet</b> found'] }];



    render();
    expect(component).toMatchSnapshot();
  });
  it('should show first document snippet if there are not metadata snippets', () => {
    props.snippets.metadata = [];
    render();
    expect(component).toMatchSnapshot();
  });
  it('should call onSnippetClick when clicking on the snippet', () => {
    render();
    component.find('.item-snippet').simulate('click');
    expect(props.onSnippetClick).toHaveBeenCalled();
  });
});