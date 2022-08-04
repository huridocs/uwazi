import React from 'react';
import { shallow } from 'enzyme';

import PagesAPI from 'app/Pages/PagesAPI';
import { PageCreator } from 'app/Pages/components/PageCreator';
import RouteHandler from 'app/App/RouteHandler';
import EditPage from '../EditPage';

describe('EditPage', () => {
  const page = { _id: 'abc2', title: 'Page 1' };
  let component;
  let context;

  beforeEach(() => {
    spyOn(PagesAPI, 'getById').and.callFake(async () => Promise.resolve(page));
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<EditPage />, { context });
  });

  it('should render a PageCreator', () => {
    expect(component.find(PageCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request page being edited', async () => {
      const data = { pageId: 'abc2' };
      const request = { data };
      const actions = await EditPage.requestState(request);

      expect(PagesAPI.getById).toHaveBeenCalledWith(request);
      expect(actions).toMatchSnapshot();
    });
  });
});
