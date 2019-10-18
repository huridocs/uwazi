"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _immutable = _interopRequireDefault(require("immutable"));
var _reactReduxForm = require("react-redux-form");
var _reactRouter = require("react-router");
var _SearchText = require("../SearchText.js");
var _SnippetList = _interopRequireDefault(require("../SnippetList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchText', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchText.SearchText, props));
    instance = component.instance();
  };

  beforeEach(() => {
    spyOn(_reactRouter.browserHistory, 'getCurrentLocation').and.returnValue({ pathname: 'path', query: { page: 1 } });
    props = {
      doc: _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      storeKey: 'storeKey',
      searchSnippets: jasmine.createSpy('searchSnippets').and.returnValue(Promise.resolve([{ page: 2 }])),
      selectSnippet: jest.fn(),
      snippets: _immutable.default.fromJS({
        metadata: [
        {
          field: 'title',
          texts: [
          'metadata <b>snippet m1</b> found'] },


        {
          field: 'metadata.summary',
          texts: [
          'metadata <b>snippets m2</b>'] }],



        fullText: [
        { text: 'first <b>snippet 1</b> found', page: 1 },
        { text: 'second <b>snippet 3</b> found', page: 2 },
        { text: 'third <b>snippet 3</b> found', page: 3 }] }) };



  });

  it('should render SnippetList and pass down same props to it', () => {
    props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' });
    render();
    const snippets = component.find(_SnippetList.default);
    expect(snippets).toMatchSnapshot();
  });

  it('should use entity view url if doc type is entity', () => {
    props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'entity' });
    render();
    const snippets = component.find(_SnippetList.default);
    expect(snippets.props().documentViewUrl).toMatchSnapshot();
  });

  describe('blankState', () => {
    describe('when there is no search term', () => {
      it('should render a blank state message', () => {
        props.snippets = _immutable.default.fromJS([]);
        props.searchTerm = '';
        render();
        expect(component.find('.blank-state')).toMatchSnapshot();
      });
    });

    describe('when there is search term', () => {
      it('should render a no matching text message', () => {
        props.snippets = _immutable.default.fromJS([]);
        props.searchTerm = 'searchTerm';
        render();
        expect(component.find('.blank-state')).toMatchSnapshot();
      });
    });
  });

  describe('searchSnippets', () => {
    it('should searchSnippets and dispatch form change', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      spyOn(_reactReduxForm.actions, 'change').and.returnValue('changeAction');
      render();
      const dispatch = jasmine.createSpy('dispatch');
      instance.attachDispatch(dispatch);

      instance.searchSnippets('term', 'docId');
      expect(props.searchSnippets).toHaveBeenCalledWith('term', 'docId', 'storeKey');
      expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('searchText.searchTerm', 'term');
      expect(dispatch).toHaveBeenCalledWith('changeAction');
    });

    it('should do nothing when searchTerm or id are undefined', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      spyOn(_reactReduxForm.actions, 'change').and.returnValue('changeAction');
      render();
      const dispatch = jasmine.createSpy('dispatch');
      instance.attachDispatch(dispatch);

      instance.searchSnippets('term', null);
      expect(props.searchSnippets).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('componentDidMount', () => {
    it('should searchSnippets when storeKey is documentViewer', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      props.searchTerm = 'term';
      render();
      spyOn(instance, 'searchSnippets');
      instance.componentDidMount();
      instance.attachDispatch(() => {});
      expect(instance.searchSnippets).not.toHaveBeenCalled();

      props.storeKey = 'documentViewer';
      render();
      instance.attachDispatch(() => {});
      spyOn(instance, 'searchSnippets');
      instance.componentDidMount();
      expect(instance.searchSnippets).toHaveBeenCalledWith('term', 'sharedId');
    });
  });

  describe('componentWillReceiveProps', () => {
    it('should searchSnippets when searchTerm or doc changes', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      props.searchTerm = 'term';
      render();
      spyOn(instance, 'searchSnippets');
      instance.componentWillReceiveProps({ searchTerm: 'term', doc: props.doc });
      expect(instance.searchSnippets).not.toHaveBeenCalled();

      instance.componentWillReceiveProps({ searchTerm: 'another term', doc: props.doc });
      expect(instance.searchSnippets).toHaveBeenCalledWith('another term', 'sharedId');

      instance.componentWillReceiveProps({ searchTerm: 'term', doc: props.doc.set('sharedId', 'another id') });
      expect(instance.searchSnippets).toHaveBeenCalledWith('term', 'another id');
    });
  });

  describe('submit', () => {
    it('should searchSnippets with value, doc id and storeKey', done => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      spyOn(_reactRouter.browserHistory, 'push');
      render();

      instance.submit({ searchTerm: 'value' }).
      then(() => {
        expect(props.searchSnippets).toHaveBeenCalledWith('value', 'sharedId', 'storeKey');
        done();
      });
    });

    it('should add searchTerm into the url query', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      render();
      spyOn(_reactRouter.browserHistory, 'push');

      instance.submit({ searchTerm: 'value' });
      expect(_reactRouter.browserHistory.push).toHaveBeenCalledWith('path?page=1&searchTerm=value');
    });
  });

  describe('on new props', () => {
    it('should set initial search to props.searchTerm and query for the snippets', () => {
      props.doc = _immutable.default.fromJS({ _id: 'id', sharedId: 'sharedId' });
      props.searchTerm = 'newSearchTerm';
      const dispatch = jasmine.createSpy('dispatch');
      render();
      instance.attachDispatch(dispatch);

      props.doc = _immutable.default.fromJS({ _id: 'another_id', sharedId: 'sharedId2' });

      instance.componentWillReceiveProps(props);
      expect(props.searchSnippets).toHaveBeenCalledWith('newSearchTerm', 'sharedId2', 'storeKey');
      expect(instance.formDispatch).toHaveBeenCalledWith(_reactReduxForm.actions.change('searchText.searchTerm', 'newSearchTerm'));
    });
  });
});