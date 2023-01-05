/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';

import Immutable from 'immutable';
import { actions as formActions } from 'react-redux-form';
import { SearchText } from '../SearchText.js';
import SnippetList from '../SnippetList';

describe('SearchText', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' }),
      storeKey: 'storeKey',
      searchSnippets: jasmine
        .createSpy('searchSnippets')
        .and.callFake(async () => Promise.resolve([{ page: 2 }])),
      selectSnippet: jest.fn(),
      snippets: Immutable.fromJS({
        metadata: [
          {
            field: 'title',
            texts: ['metadata <b>snippet m1</b> found'],
          },
          {
            field: 'metadata.summary',
            texts: ['metadata <b>snippets m2</b>'],
          },
        ],
        fullText: [
          { text: 'first <b>snippet 1</b> found', page: 1 },
          { text: 'second <b>snippet 3</b> found', page: 2 },
          { text: 'third <b>snippet 3</b> found', page: 3 },
        ],
      }),
      location: {
        pathname: 'path',
      },
      navigate: jest.fn(),
      searchParams: new URLSearchParams('?page=1'),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  const render = () => {
    component = shallow(<SearchText {...props} />);
    instance = component.instance();
  };

  it('should render SnippetList and pass down same props to it', () => {
    props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'document' });
    render();
    const snippets = component.find(SnippetList);
    expect(snippets).toMatchSnapshot();
  });

  it('should use entity view url if doc type is entity', () => {
    props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId', type: 'entity' });
    render();
    const snippets = component.find(SnippetList);
    expect(snippets.props().documentViewUrl).toMatchSnapshot();
  });

  describe('blankState', () => {
    describe('when there is no search term', () => {
      it('should render a blank state message', () => {
        props.snippets = Immutable.fromJS([]);
        props.searchTerm = '';
        render();
        expect(component.find('.blank-state')).toMatchSnapshot();
      });
    });

    describe('when there is search term', () => {
      it('should render a no matching text message', () => {
        props.snippets = Immutable.fromJS([]);
        props.searchTerm = 'searchTerm';
        render();
        expect(component.find('.blank-state')).toMatchSnapshot();
      });
    });
  });

  describe('searchSnippets', () => {
    it('should searchSnippets and dispatch form change', () => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      spyOn(formActions, 'change').and.returnValue('changeAction');
      render();
      const dispatch = jasmine.createSpy('dispatch');
      instance.attachDispatch(dispatch);

      instance.searchSnippets('term', 'docId');
      expect(props.searchSnippets).toHaveBeenCalledWith('term', 'docId', 'storeKey');
      expect(formActions.change).toHaveBeenCalledWith('searchText.searchTerm', 'term');
      expect(dispatch).toHaveBeenCalledWith('changeAction');
    });

    it('should do nothing when searchTerm or id are undefined', () => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      spyOn(formActions, 'change').and.returnValue('changeAction');
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
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
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

  describe('Component update', () => {
    it('should searchSnippets when searchTerm or doc changes', () => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      props.searchTerm = 'term';
      render();
      spyOn(instance, 'searchSnippets');
      component.setProps({ searchTerm: 'term', doc: props.doc });
      expect(instance.searchSnippets).not.toHaveBeenCalled();

      component.setProps({ searchTerm: 'another term', doc: props.doc });
      expect(instance.searchSnippets).toHaveBeenCalledWith('another term', 'sharedId');

      component.setProps({
        searchTerm: 'term',
        doc: props.doc.set('sharedId', 'another id'),
      });
      expect(instance.searchSnippets).toHaveBeenCalledWith('term', 'another id');
    });
  });

  describe('submit', () => {
    it('should searchSnippets with value, doc id and storeKey', done => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      render();

      instance.submit({ searchTerm: 'value' }).then(() => {
        expect(props.searchSnippets).toHaveBeenCalledWith('value', 'sharedId', 'storeKey');
        done();
      });
    });

    it('should add searchTerm into the url query', () => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      render();

      instance.submit({ searchTerm: 'value' });
      expect(props.navigate).toHaveBeenCalledWith('path?page=1&searchTerm=value');
    });
  });

  describe('on new props', () => {
    it('should set initial search to props.searchTerm and query for the snippets', () => {
      props.doc = Immutable.fromJS({ _id: 'id', sharedId: 'sharedId' });
      props.searchTerm = 'newSearchTerm';
      const dispatch = jasmine.createSpy('dispatch');
      render();
      instance.attachDispatch(dispatch);

      props.doc = Immutable.fromJS({ _id: 'another_id', sharedId: 'sharedId2' });

      component.setProps(props);
      expect(props.searchSnippets).toHaveBeenCalledWith('newSearchTerm', 'sharedId2', 'storeKey');
      expect(instance.formDispatch).toHaveBeenCalledWith(
        formActions.change('searchText.searchTerm', 'newSearchTerm')
      );
    });
  });
});
