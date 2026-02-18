import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { EntitiesAPI } from '../../Entities/EntitiesAPI.js';
import { Entity as EntityView } from '../EntityView.js';
import { PDFViewComponent } from '../PDFView.js';
import { ViewerRouteComponent as ViewerRoute } from '../ViewerRoute.js';
import { ViewerComponent } from '../components/ViewerComponent.js';

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
              collection: Immutable.fromJS({
                languages: [{ key: 'en', label: 'English', default: true }],
              }),
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
            collection: Immutable.fromJS({
              languages: [{ key: 'en', label: 'English', default: true }],
            }),
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
