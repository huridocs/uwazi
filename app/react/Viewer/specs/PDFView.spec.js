/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { fromJS } from 'immutable';
import { shallow } from 'enzyme';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { actions } from 'app/BasicReducer';
import { PDFView, PDFViewComponent } from 'app/Viewer/PDFView';
import { ConnectedViewer as Viewer } from 'app/Viewer/components/Viewer';
import RouteHandler from 'app/App/RouteHandler';
import * as utils from 'app/utils';
import { RequestParams } from 'app/utils/RequestParams';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import * as documentActions from 'app/Viewer/actions/documentActions';
import * as routeActions from '../actions/routeActions';
import * as uiActions from '../actions/uiActions';

let page = 0;
let raw = 'abc';
let pathname = '';
let ref = '';
let anotherProp = '';

const mockUseLocation = jest.fn().mockImplementation(() => ({
  search: `?raw=${raw},page=${page}`,
  pathname,
}));

const mapProperties = props => {
  const map = new Map();
  Object.entries(props).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
};
const mockUseSearchParams = jest.fn().mockImplementation(() => {
  const params = mapProperties({ raw, page });
  if (ref) {
    params.set('ref', ref);
  }
  if (anotherProp) {
    params.set('anotherProp', anotherProp);
  }

  return [params];
});
const mockNavigate = jest.fn().mockImplementation(path => path);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => mockUseSearchParams(),
  useLocation: () => mockUseLocation(),
  useNavigate: () => path => mockNavigate(path),
  useMatches: () => {},
}));
jest.mock('app/ContextMenu', () => () => <div>ContextMenu</div>);
jest.mock('app/App/Footer', () => () => <div>Footer</div>);
jest.mock('app/Viewer/components/ViewMetadataPanel', () => () => <div>ViewMetadataPanel</div>);
jest.mock('app/Connections', () => ({
  CreateConnectionPanel: () => <div>CreateConnectionPanel</div>,
}));

describe('PDFView', () => {
  let component;
  let context;
  let props;

  const state = {
    documentViewer: {
      uiState: fromJS({ reference: { targetRange: [] } }),
      targetDoc: fromJS({ _id: 'document1' }),
      sidepanel: { tab: '1', metadata: { _id: 'prop1' } },
      targetDocReferences: [],
    },
    connections: { connection: fromJS({}) },
    user: fromJS({ _id: 'user1' }),
    settings: { collection: fromJS({}) },
    modals: fromJS({ ConfirmCloseForm: fromJS({ _id: 'document1' }) }),
    semanticSearch: { selectedDocument: fromJS({}) },
  };

  const render = () => {
    RouteHandler.renderedFromServer = true;
    component = renderConnectedMount(PDFView, state, props, true);
    component.instance().getChildContext().store.dispatch = context.store.dispatch;
  };

  beforeEach(() => {
    page = 1;
    raw = '';
    pathname = '';
    ref = '';
    anotherProp = '';

    const dispatch = jasmine.createSpy('dispatch');
    context = {
      store: {
        getState: () => ({}),
        dispatch: dispatch.and.callFake(action =>
          typeof action === 'function' ? action(dispatch) : action
        ),
        subscribe: jasmine.createSpy('subscribe'),
      },
    };

    props = {
      entity: fromJS({
        sharedId: 'a2b4c3',
        defaultDoc: { _id: 'documentId', sharedId: 'sharedId', filename: '1234.pdf' },
      }),
      routes: [],
    };
    spyOn(routeActions, 'requestViewerState');

    spyOn(routeActions, 'setViewerState').and.returnValue({ type: 'setViewerState' });
  });

  it('should pass down raw property', () => {
    raw = 'true';
    page = 2;
    render();
    expect(component.find(Viewer).props().raw).toEqual(true);
  });

  describe('when on server', () => {
    it('should always pass raw true', () => {
      raw = 'false';
      // eslint-disable-next-line no-import-assign
      utils.isClient = false;
      render();
      expect(component.find(Viewer).props().raw).toBe(true);
      // eslint-disable-next-line no-import-assign
      utils.isClient = true;
    });
  });

  it('should render the Viewer', () => {
    render();
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('when raw', () => {
    it('should render link canonical to the not raw version', () => {
      raw = 'true';
      page = 1;
      pathname = 'pathname';
      render();

      expect(component.find({ link: [{ rel: 'canonical' }] })).toMatchSnapshot();
    });

    describe('when page is undefined', () => {
      it('should render link canonical with a default page', () => {
        raw = 'true';
        page = undefined;
        pathname = 'pathname';
        render();
        expect(component.find({ link: [{ rel: 'canonical' }] })).toMatchSnapshot();
      });
    });
  });
  describe('when not raw', () => {
    it('should not render link canonical', () => {
      raw = 'false';
      page = 1;
      pathname = 'pathname';
      render();
      expect(component.find({ link: [{ href: 'pathname?page=1', rel: 'canonical' }] }).length).toBe(
        0
      );
    });
  });
  describe('static requestState', () => {
    it('should call on requestViewerState', () => {
      const requestParams = new RequestParams({
        documentId: 'documentId',
        lang: 'es',
        page: 4,
        raw: 'true',
      });
      PDFView.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith(
        new RequestParams({ documentId: 'documentId', lang: 'es', raw: true, page: 4 }),
        'globalResources'
      );
    });

    it('should modify raw to true if is server side rendered', () => {
      // eslint-disable-next-line no-import-assign
      utils.isClient = false;
      const requestParams = new RequestParams({
        documentId: 'documentId',
        lang: 'es',
        raw: 'false',
      });
      PDFView.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith(
        new RequestParams({ documentId: 'documentId', lang: 'es', raw: true }),
        'globalResources'
      );
    });
  });

  describe('onDocumentReady', () => {
    it('should scrollToPage on the query when not on raw mode', () => {
      spyOn(uiActions, 'scrollToPage');
      raw = 'false';
      page = 15;
      render();
      component.find({ page: 15 }).at(0).props().onDocumentReady();
      expect(uiActions.scrollToPage).toHaveBeenCalledWith(15, 0);

      raw = 'true';
      render();
      uiActions.scrollToPage.calls.reset();
      component.find({ page: 15 }).at(0).props().onDocumentReady();
      expect(uiActions.scrollToPage).not.toHaveBeenCalled();
    });

    it('should activate text reference if query parameters have reference id', () => {
      spyOn(uiActions, 'activateReference').and.returnValue({ type: 'ABC' });
      raw = 'false';
      ref = 'refId';
      pathname = 'pathname';
      const reference = { _id: 'refId', range: { start: 200, end: 300 }, text: 'test' };
      const doc = fromJS({
        relations: [{ _id: 'otherRef' }, reference],
      });
      render();
      component.find({ page: 1 }).at(0).props().onDocumentReady(doc);
      expect(uiActions.activateReference).toHaveBeenCalledWith(reference);
    });

    it('should emit documentLoaded event', () => {
      spyOn(uiActions, 'scrollToPage');
      spyOn(utils.events, 'emit');
      render();

      component.find({ page: 1 }).at(0).props().onDocumentReady();
      expect(utils.events.emit).toHaveBeenCalledWith('documentLoaded');
    });
  });

  describe('changePage', () => {
    describe('when raw', () => {
      it('should changeBrowserHistoryPage', () => {
        raw = 'true';
        page = 15;
        anotherProp = 'test';
        pathname = 'pathname';
        spyOn(uiActions, 'scrollToPage');
        render();

        component.find({ page: 15 }).at(0).props().changePage(16);
        expect(mockNavigate).toHaveBeenCalledWith('pathname?raw=true&anotherProp=test&page=16');
        expect(uiActions.scrollToPage).not.toHaveBeenCalled();
      });
    });

    describe('when not raw', () => {
      it('should scrollToPage', () => {
        raw = 'false';
        page = 15;
        anotherProp = 'test';
        pathname = 'pathname';
        spyOn(uiActions, 'scrollToPage');
        mockNavigate.mockClear();

        render();
        component.find({ page: 15 }).at(0).props().changePage(16);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(uiActions.scrollToPage).toHaveBeenCalledWith(16);
      });
    });
  });

  const shallowComponent = searchParams =>
    shallow(
      <PDFViewComponent
        searchParams={searchParams}
        location={{ pathname: 'pathname' }}
        entity={fromJS({})}
        navigate={mockNavigate}
      />
    );

  describe('componentWillReceiveProps', () => {
    it('should load raw page when page/raw changes and raw is true', async () => {
      spyOn(entitiesAPI, 'getRawPage').and.returnValue(Promise.resolve('raw text'));
      const searchParams = mapProperties({ raw: 'true', page: 15 });
      const wrapper = shallowComponent(searchParams);
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();
      wrapper.instance().context = context;
      mockNavigate.mockClear();
      entitiesAPI.getRawPage.calls.reset();
      searchParams.set('page', 16);
      searchParams.set('raw', 'false');
      wrapper.setProps({ searchParams });
      wrapper.update();
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();
      entitiesAPI.getRawPage.calls.reset();
      const newSearchParams = mapProperties({ raw: 'true', page: 17 });

      wrapper.setProps({
        searchParams: newSearchParams,
        entity: fromJS({ defaultDoc: { _id: 'documentId' } }),
      });
      await wrapper.update();
      expect(context.store.dispatch).toHaveBeenCalledWith(
        actions.set('viewer/rawText', 'raw text')
      );
      expect(entitiesAPI.getRawPage).toHaveBeenCalledWith(
        new RequestParams({ _id: 'documentId', page: 17 })
      );
    });
  });

  describe('changeBrowserHistoryPage', () => {
    it('should push new browserHistory with new page', () => {
      const searchParams = mapProperties({ raw: 'true', page: 15, anotherProp: 'test' });
      const wrapper = shallowComponent(searchParams);
      wrapper.instance().changeBrowserHistoryPage(16);
      expect(mockNavigate).toHaveBeenCalledWith('pathname?raw=true&anotherProp=test&page=16', {
        replace: true,
      });

      mockNavigate.mockClear();
      searchParams.set('raw', 'false');
      searchParams.delete('anotherProp');
      wrapper.setProps({ searchParams });
      wrapper.update();
      wrapper.instance().changeBrowserHistoryPage(16);
      expect(mockNavigate).toHaveBeenCalledWith('pathname?raw=false&page=16', { replace: true });
    });
  });

  describe('componentWillUnmount', () => {
    it('should leave edit mode', () => {
      spyOn(documentActions, 'leaveEditMode').and.returnValue({ type: 'LEAVING_EDIT_MODE' });
      render();
      component.unmount();
      expect(documentActions.leaveEditMode).toHaveBeenCalled();
    });
  });
});
