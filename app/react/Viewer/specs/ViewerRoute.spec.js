import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import { RequestParams } from 'app/utils/RequestParams';
import EntitiesAPI from '../../Entities/EntitiesAPI';
import EntityView from '../EntityView';
import { PDFViewComponent } from '../PDFView';
import { ViewerRouteComponent as ViewerRoute } from '../ViewerRoute';
import { ViewerComponent } from '../components/ViewerComponent';

describe('ViewerRoute', () => {
  const entity = { _id: 1, sharedId: 'sid', documents: [{}] };

  beforeEach(() => {
    spyOn(EntitiesAPI, 'get').and.callFake(async () => Promise.resolve([entity]));
    spyOn(EntityView, 'requestState').and.returnValue('EntityView state');
    spyOn(PDFViewComponent, 'requestState').and.returnValue('PDFView state');
  });

  describe('requestState', () => {
    describe('when the entity has a pdf', () => {
      it('should return the PDFView state', async () => {
        const request = new RequestParams({ sharedId: '123' }, 'headers');
        const state = await ViewerRoute.requestState(request, {
          templates: 'templates',
          settings: {
            collection: fromJS({ languages: [{ key: 'en', label: 'English', default: true }] }),
          },
        });
        expect(state).toBe('PDFView state');
      });
    });

    describe('when the entity does not have a pdf', () => {
      it('should return the entityView state', async () => {
        entity.documents = [];
        const request = new RequestParams({ sharedId: '123' }, 'headers');
        const state = await ViewerRoute.requestState(request, { templates: 'templates' });
        expect(state).toBe('EntityView state');
      });
    });
  });

  describe('render', () => {
    it('should render a ViewerComponent', () => {
      const context = {
        store: {
          getState: () => ({}),
          dispatch: () => {},
        },
      };
      const component = shallow(<ViewerRoute routeParams={{ tabView: 'metadata' }} />, { context });
      expect(component.find(ViewerComponent).length).toBe(1);
    });
  });
});
