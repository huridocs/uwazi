/** @format */

import React from 'react';

import { shallow } from 'enzyme';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { RequestParams } from 'app/utils/RequestParams';
import EntitiesAPI from '../../Entities/EntitiesAPI';
import EntityView from '../EntityView';

describe('EntityView', () => {
  describe('requestState', () => {
    const entities = [{ _id: 1, sharedId: 'sid' }];
    const relationTypes = [{ _id: 1, name: 'against' }];

    beforeEach(() => {
      spyOn(EntitiesAPI, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(RelationTypesAPI, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(prioritySortingCriteria, 'get').and.returnValue({ sort: 'priorized' });
      spyOn(relationships, 'requestState').and.returnValue(
        Promise.resolve(['connectionsGroups', 'searchResults', 'sort', 'filters'])
      );
      spyOn(relationships, 'emptyState').and.returnValue({ type: 'RELATIONSHIPS_EMPTY_STATE' });
      spyOn(relationships, 'setReduxState').and.returnValue({
        type: 'RELATIONSHIPS_SET_REDUX_STATE',
      });
    });

    it('should get the entity, and all connectionsList items', async () => {
      const request = new RequestParams({ sharedId: '123' }, 'headers');
      const actions = await EntityView.requestState(request, { templates: 'templates' });

      expect(relationships.requestState).toHaveBeenCalledWith(request, { templates: 'templates' });
      expect(EntitiesAPI.get).toHaveBeenCalledWith(request);
      expect(RelationTypesAPI.get).toHaveBeenCalledWith({ headers: 'headers' });

      expect(actions).toMatchSnapshot();
    });
  });
});
