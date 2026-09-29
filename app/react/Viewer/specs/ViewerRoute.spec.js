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
      let rendering = false;
      let wroteDuringRender = false;
      const { render } = ViewerRoute.prototype;
      const renderSpy = jest
        .spyOn(ViewerRoute.prototype, 'render')
        .mockImplementation(function mockedRender() {
          rendering = true;
          try {
            return render.call(this);
          } finally {
            rendering = false;
          }
        });
      const storeDispatch = jasmine.createSpy('dispatch').and.callFake(() => {
        wroteDuringRender = wroteDuringRender || rendering;
      });

      try {
        shallow(<ViewerRoute params={{ tabView: 'references' }} location={{ search: '' }} />, {
          context: { store: { getState: () => ({}), dispatch: storeDispatch } },
        });
        expect(wroteDuringRender).toBe(false);
        expect(storeDispatch).toHaveBeenCalledWith(
          actions.set('viewer.sidepanel.tab', 'references')
        );
      } finally {
        renderSpy.mockRestore();
      }
    });

    it('should select the route tab after mount', () => {
      const component = renderRoute({ tabView: 'metadata' });
      dispatch.calls.reset();
      spyOn(component.instance(), 'getClientState').and.returnValue(Promise.resolve());
      component.instance().componentDidMount();
      expect(dispatch).toHaveBeenCalledWith(actions.set('viewer.sidepanel.tab', 'metadata'));
      expect(dispatch).toHaveBeenCalledWith(showTab('info'));
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
