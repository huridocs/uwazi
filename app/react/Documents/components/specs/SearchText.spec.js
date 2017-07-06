import React from 'react';
import {shallow} from 'enzyme';

import {SearchText} from '../SearchText.js';
import Immutable from 'immutable';
import {Link} from 'react-router';
import {actions as formActions} from 'react-redux-form';
import {browserHistory} from 'react-router';

describe('SearchText', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<SearchText {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    spyOn(browserHistory, 'getCurrentLocation').and.returnValue({pathname: 'path', query: {page: 1}});
    props = {
      storeKey: 'storeKey',
      searchSnippets: jasmine.createSpy('searchSnippets').and.returnValue(Promise.resolve([{page: 2}])),
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
    expect(component.find(Link).at(0).props().to.query).toEqual({page: 1, searchTerm: ''});
    expect(snippets.at(1).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[1].text + ' ...'});
    expect(snippets.at(2).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets.toJS()[2].text + ' ...'});
  });

  it('should scrollToPage when click on a snippet link', () => {
    props.scrollToPage = jasmine.createSpy('scrollToPage');
    render();
    component.find(Link).at(1).simulate('click');
    expect(props.scrollToPage).toHaveBeenCalledWith(2);
  });

  describe('submit', () => {
    it('should searchSnippets with value, doc id and storeKey', (done) => {
      props.doc = Immutable.fromJS({_id: 'id', sharedId: 'sharedId'});
      render();

      instance.submit({searchTerm: 'value'})
      .then(() => {
        expect(props.searchSnippets).toHaveBeenCalledWith('value', 'sharedId', 'storeKey');
        done();
      });
    });

    it('should add searchTerm into the url query', () => {
      props.doc = Immutable.fromJS({_id: 'id', sharedId: 'sharedId'});
      render();
      spyOn(browserHistory, 'push');

      instance.submit({searchTerm: 'value'});
      expect(browserHistory.push).toHaveBeenCalledWith('path?page=1&searchTerm=value');
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
