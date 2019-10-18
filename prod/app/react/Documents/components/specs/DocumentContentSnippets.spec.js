"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../../I18N");
var _reactRouter = require("react-router");
var _SnippetList = require("../SnippetList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SnippetList', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SnippetList.DocumentContentSnippets, props));
  };

  beforeEach(() => {
    spyOn(_reactRouter.browserHistory, 'getCurrentLocation').and.returnValue({ pathname: 'path', query: { page: 1 } });
    props = {
      doc: _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      searchTerm: 'snippet',
      documentViewUrl: '/document/sharedId',
      selectSnippet: jest.fn(),
      selectedSnippet: _immutable.default.fromJS({ text: 'first <b>snippet 1</b> found', page: 1 }),
      documentSnippets: _immutable.default.fromJS([
      { text: 'first <b>snippet 1</b> found', page: 1 },
      { text: 'second <b>snippet 3</b> found', page: 2 },
      { text: 'third <b>snippet 3</b> found', page: 3 }]) };


  });

  it('should render all document snippets', () => {
    render();
    const snippets = component;
    expect(snippets).toMatchSnapshot();
  });

  it('should selectSnippet when click on a snippet link', () => {
    props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' });
    props.selectSnippet = jest.fn();
    render();
    component.find(_I18N.I18NLink).at(1).simulate('click');
    expect(props.selectSnippet).toHaveBeenCalledWith(2, _immutable.default.fromJS({ text: 'second <b>snippet 3</b> found', page: 2 }));
  });
});