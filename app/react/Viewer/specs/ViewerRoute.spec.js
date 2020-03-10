import React from 'react';

import { shallow } from 'enzyme';

import { RequestParams } from 'app/utils/RequestParams';
import EntitiesAPI from '../../Entities/EntitiesAPI';
import EntityView from '../EntityView';
import PDFView from '../PDFView';
import ViewerRoute from '../ViewerRoute';
import ViewerComponent from '../components/ViewerComponent';

describe('ViewerRoute', () => {
  describe('requestState', () => {
    const entity = { _id: 1, sharedId: 'sid', documents: [{}] };

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve([entity]));
      spyOn(EntityView, 'requestState').and.returnValue('EntityView state');
      spyOn(PDFView, 'requestState').and.returnValue('PDFView state');
    });

    describe('when the entity has a pdf', () => {
      it('should return the PDFView state', async () => {
        const request = new RequestParams({ sharedId: '123' }, 'headers');
        const state = await ViewerRoute.requestState(request, { templates: 'templates' });
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
      const component = shallow(<ViewerRoute />, { context });
      expect(component.find(ViewerComponent).length).toBe(1);
    });
  });
});
