import { Link } from 'react-router';
import React from 'react';
import { shallow } from 'enzyme';

import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

import { ViewDocumentLinkBase as ViewDocumentLink } from '../ViewDocumentLink';

const renderComponent = (entity: EntitySchema, pathname: string = 'entity/') =>
  shallow(
    <ViewDocumentLink entity={entity} filename="file.pdf" router={{ location: { pathname } }} />
  );

describe('ViewDocumentLink', () => {
  const entity: EntitySchema = { _id: 'id', sharedId: 'sharedId' };

  describe('when on viewer route', () => {
    it('should change file name and set page 1', () => {
      const component = renderComponent(entity);
      expect(component.find(CurrentLocationLink).props().queryParams).toEqual({
        file: 'file.pdf',
        page: 1,
      });
    });
  });
  describe('when outside viewer route', () => {
    it('should link to viewer with specific file', () => {
      const component = renderComponent(entity, 'outside');
      expect(component.find(Link).props().to).toEqual('/entity/sharedId?file=file.pdf');
    });
  });
});
