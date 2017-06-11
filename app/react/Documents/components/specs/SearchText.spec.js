import React from 'react';
import {shallow} from 'enzyme';

import {SearchText} from '../SearchText.js';
import Immutable from 'immutable';

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
        'first <b>snippet 1</b> found',
        'second <b>snippet 2</b> found',
        'third <b>snippet 3</b> found'
      ])
    };
  });

  it('should render all snippets with dangerouslySetInnerHTML', () => {
    render();
    let snippets = component.find('li');
    expect(snippets.length).toBe(3);
    expect(snippets.at(0).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[0]});
    expect(snippets.at(1).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[1]});
    expect(snippets.at(2).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[2]});
  });

  it('should render doc snippets if search snippets are empty', () => {
    props.snippets = Immutable.fromJS([]);
    props.doc = Immutable.fromJS({
      _id: 'id',
      snippets: [
        'doc snippet 1',
        'doc snippet 2'
      ]
    });

    render();
    let snippets = component.find('li');
    expect(snippets.length).toBe(2);
    expect(snippets.at(0).props().dangerouslySetInnerHTML).toEqual({__html: 'doc snippet 1'});
    expect(snippets.at(1).props().dangerouslySetInnerHTML).toEqual({__html: 'doc snippet 2'});
  });

  describe('submit', () => {
    it('should searchSnippets with value, doc id and storeKey', () => {
      props.doc = Immutable.fromJS({_id: 'id', sharedId: 'sharedId'});
      render();

      instance.submit({searchTerm: 'value'});
      expect(props.searchSnippets).toHaveBeenCalledWith('value', 'sharedId', 'storeKey');
    });
  });
});
