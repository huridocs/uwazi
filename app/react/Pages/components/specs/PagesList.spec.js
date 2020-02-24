import { fromJS, Map } from 'immutable';
import React from 'react';

import { I18NLink } from 'app/I18N';
import { shallow } from 'enzyme';

import { PagesList } from '../PagesList';

describe('PagesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      pages: fromJS([
        { _id: 1, title: 'Page 1', sharedId: 'a1' },
        { _id: 2, title: 'Page 2', sharedId: 'a2' },
        { _id: 3, title: 'Page 3', sharedId: 'a3' },
      ]),
      deletePage: jasmine.createSpy('deletePage').and.returnValue(Promise.resolve()),
    };

    context = {
      confirm: jasmine.createSpy('confirm'),
    };
  });

  const render = () => {
    component = shallow(<PagesList {...props} />, { context });
  };

  describe('render', () => {
    it('should render a list with all pages names', () => {
      render();
      expect(component.find('ul.pages').find('li').length).toBe(3);
      const nameLink = component
        .find('ul.pages')
        .find('li')
        .last()
        .find(I18NLink)
        .first();
      expect(nameLink.props().to).toBe('/settings/pages/edit/a3');
      expect(nameLink.props().children).toBe('Page 3');
    });

    it('should have a button to add a page', () => {
      render();
      expect(
        component
          .find(I18NLink)
          .last()
          .props().to
      ).toBe('/settings/pages/new');
    });
  });

  describe('deletePage', () => {
    const page = Map({ _id: 3, title: 'Judge', sharedId: 'a3' });
    beforeEach(() => {
      render();
      component.instance().deletePage(page);
    });

    it('should confirm the action', () => {
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should call on props.deletePage if confirmed', () => {
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deletePage).toHaveBeenCalledWith(page.toJS());
    });
  });
});
