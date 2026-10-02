import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { actions } from '../../BasicReducer/index.js';
import { showTab } from '../../Entities/actions/uiActions.js';
import { EntitiesAPI } from '../../Entities/EntitiesAPI.js';
import { Entity as EntityView } from '../EntityView.js';
import { PDFViewComponent } from '../PDFView.js';
import { ViewerRouteComponent as ViewerRoute } from '../ViewerRoute.js';
import { ViewerComponent } from '../components/ViewerComponent.js';

describe('ViewerRoute', () => {
  describe('tab selection', () => {
    let dispatch;

    const renderRoute = params => {
      dispatch = jasmine.createSpy('dispatch');
      return shallow(<ViewerRoute params={params} location={{ search: '' }} />, {
        context: { store: { getState: () => ({}), dispatch } },
      });
    };

    it('should not write the store while rendering', () => {
      const selectTab = jest.spyOn(ViewerRoute.prototype, 'selectTab');
      const component = renderRoute({ tabView: 'references' });
      expect(dispatch).toHaveBeenCalledWith(actions.set('viewer.sidepanel.tab', 'references'));
      selectTab.mockClear();
      dispatch.calls.reset();
      void component.instance().render();
      expect(selectTab).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();
      selectTab.mockRestore();
    });

    it('should select the route tab after mount', () => {
      renderRoute({ tabView: 'metadata' });
      expect(dispatch).toHaveBeenCalledWith(actions.set('viewer.sidepanel.tab', 'metadata'));
      expect(dispatch).toHaveBeenCalledWith(showTab('info'));
    });

    it('should leave the entity tab alone when the route has no tab', () => {
      renderRoute({});
      expect(dispatch).not.toHaveBeenCalledWith(showTab('info'));
      expect(dispatch).not.toHaveBeenCalledWith(actions.set('viewer.sidepanel.tab', 'metadata'));
    });

    it('should select the route tab when it changes', () => {
      const component = renderRoute({ tabView: 'metadata' });
      spyOn(component.instance(), 'getClientState').and.returnValue(Promise.resolve());
      dispatch.calls.reset();
      component.setProps({ params: { tabView: 'relationships' } });
      expect(dispatch).toHaveBeenCalledWith(actions.set('viewer.sidepanel.tab', 'relationships'));
      expect(dispatch).toHaveBeenCalledWith(showTab('relationships'));
    });
  });

  describe('Entity views', () => {
    const entity = {
      _id: 1,
      sharedId: 'sid',
      language: 'en',
      documents: [{ status: 'ready' }],
    };

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.callFake(async () => Promise.resolve([entity]));
      spyOn(EntityView, 'requestState').and.returnValue('EntityView state');
      spyOn(PDFViewComponent, 'requestState').and.returnValue('PDFView state');
    });

    describe('requestState', () => {
      describe('when the entity has a ready pdf', () => {
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

      describe('when the entity only has a non-ready pdf', () => {
        it('should return the entityView state', async () => {
          entity.documents = [{ status: 'processing' }];
          const request = new RequestParams({ sharedId: '123' }, 'headers');
          const state = await ViewerRoute.requestState(request, {
            templates: 'templates',
            settings: {
              collection: Immutable.fromJS({
                languages: [{ key: 'en', label: 'English', default: true }],
              }),
            },
          });
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

      spyOn(EntitiesAPI, 'get').and.callFake(async () =>
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
        expect(e.message).toContain('Not found');
      }
    });
  });
});
