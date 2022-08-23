import React from 'react';
import { shallow } from 'enzyme';
import PagesAPI from 'app/Pages/PagesAPI';
import PagesList from 'app/Pages/components/PagesList';
import { Pages } from '../Pages';

describe('Pages', () => {
  let component;
  let context;
  const pages = [{ _id: 1, name: 'Page 1' }];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };

    spyOn(PagesAPI, 'get').and.callFake(async () => Promise.resolve(pages));
    component = shallow(<Pages />, { context });
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', async () => {
      const actions = await Pages.requestState();
      expect(actions).toMatchSnapshot();
    });
  });

  describe('render', () => {
    it('should render a PagesList', () => {
      expect(component.find(PagesList).length).toBe(1);
    });
  });
});
