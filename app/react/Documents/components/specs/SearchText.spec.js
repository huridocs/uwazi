import React from 'react';
import {shallow} from 'enzyme';

import {SearchText} from '../SearchText.js';
import Immutable from 'immutable';
import {actions as formActions} from 'react-redux-form';

describe('SearchText', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<SearchText {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      storeKey: 'storeKey',
      searchSnippets: jasmine.createSpy('searchSnippets'),
      snippets: Immutable.fromJS([
        {text: 'first <b>snippet 1</b> found', page: 1},
        {text: 'second <b>snippet 3</b> found', page: 2},
        {text: 'third <b>snippet 3</b> found', page: 3}
      ])
    };
  });

  it('should render all snippets with dangerouslySetInnerHTML', () => {
    render();
    let snippets = component.find('li span');
    expect(snippets.length).toBe(3);
    expect(snippets.at(0).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[0].text + ' ...'});
    expect(snippets.at(1).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[1].text + ' ...'});
    expect(snippets.at(2).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[2].text + ' ...'});
  });

  describe('submit', () => {
    it('should searchSnippets with value, doc id and storeKey', () => {
      props.doc = Immutable.fromJS({_id: 'id', sharedId: 'sharedId'});
      render();

      instance.submit({searchTerm: 'value'});
      expect(props.searchSnippets).toHaveBeenCalledWith('value', 'sharedId', 'storeKey');
    });
  });

  describe('on new props', () => {
    it('should set initial search to props.searchTerm and query for the snippets', () => {
      props.doc = Immutable.fromJS({_id: 'id', sharedId: 'sharedId'});
      props.searchTerm = 'newSearchTerm';
      let dispatch = jasmine.createSpy('dispatch');
      render();
      instance.attachDispatch(dispatch);

      props.doc = Immutable.fromJS({_id: 'another_id', sharedId: 'sharedId2'});

      instance.componentWillReceiveProps(props);
      expect(props.searchSnippets).toHaveBeenCalledWith('newSearchTerm', 'sharedId2', 'storeKey');
      expect(instance.formDispatch).toHaveBeenCalledWith(formActions.change('searchText.searchTerm', 'newSearchTerm'));
    });
  });
});
