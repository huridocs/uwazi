import React from 'react';
import { shallow } from 'enzyme';

import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import EntitiesAPI from '#app/Entities/EntitiesAPI.js';
import EntityView from '#app/Viewer/EntityView.jsx';
import { PDFViewComponent } from '#app/Viewer/PDFView.jsx';
import { ViewerRouteComponent as ViewerRoute } from '#app/Viewer/ViewerRoute.jsx';
import { ViewerComponent } from '#app/Viewer/components/ViewerComponent.jsx';
import Immutable from 'immutable';


describe('ViewerRoute', () => {
  describe('Entity views', () => {
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
              collection: Immutable.fromJS({ languages: [{ key: 'en', label: 'English', default: true }] }),
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
        const component = shallow(<ViewerRoute routeParams={{ tabView: 'metadata' }} />, {
          context,
        });
        expect(component.find(ViewerComponent).length).toBe(1);
      });
    });
  });

  describe('Entity not found', () => {
    it('should throw a FetchResponseError exception', async () => {
      const request = new RequestParams({ sharedId: '123' }, 'headers');

      spyOn(EntitiesAPI, 'get').and.callFake(() =>
        Promise.reject(
          new FetchResponseError('Not found', {
            status: 404,
            name: 'client error',
            json: {
              message: 'not found',
            },
          })
        )
      );

      try {
        await ViewerRoute.requestState(request, {
          templates: 'templates',
          settings: {
            collection: Immutable.fromJS({ languages: [{ key: 'en', label: 'English', default: true }] }),
          },
        });
        fail('Should throw error');
      } catch (e) {
        expect(e.status).toBe(404);
        expect(e.message).toMatch('Not found');
      }
    });
  });
});
