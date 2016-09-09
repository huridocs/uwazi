import React from 'react';
import {shallow} from 'enzyme';
import {fromJS, Map} from 'immutable';

import {PagesList} from '../PagesList';
import {Link} from 'react-router';

describe('EntityTypesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      pages: fromJS([
        {_id: 1, title: 'Page 1'},
        {_id: 2, title: 'Page 2'},
        {_id: 3, title: 'Page 3'}
      ]),
      deletePage: jasmine.createSpy('deletePage').and.returnValue(Promise.resolve())
    };

    context = {
      confirm: jasmine.createSpy('confirm')
    };
  });

  let render = () => {
    component = shallow(<PagesList {...props} />, {context});
  };

  describe('render', () => {
    it('should render a list with all pages names', () => {
      render();
      expect(component.find('ul.pages').find('li').length).toBe(3);
      let nameLink = component.find('ul.pages').find('li').last().find(Link).first();
      expect(nameLink.props().to).toBe('/settings/pages/edit/3');
      expect(nameLink.props().children).toBe('Page 3');
    });

    it('should have a button to add a page', () => {
      render();
      expect(component.find(Link).last().props().to).toBe('/settings/pages/new');
    });
  });

  describe('deletePage', () => {
    beforeEach(() => {
      render();
      component.instance().deletePage(Map({_id: 3, title: 'Judge'}));
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deletePage if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deletePage).toHaveBeenCalledWith({_id: 3});
    });
  });
});
