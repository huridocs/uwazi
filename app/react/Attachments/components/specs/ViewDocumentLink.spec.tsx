import { Link } from 'react-router-dom';
import React from 'react';
import { shallow } from 'enzyme';

import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

import { ViewDocumentLink } from '../ViewDocumentLink';

const mockedUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockedUseLocation,
}));
const renderComponent = (entity: EntitySchema, pathname: string = 'entity/') => {
  mockedUseLocation.mockReturnValue({ pathname });
  return shallow(
    <ViewDocumentLink entity={entity} filename="file.pdf">
      ' '
    </ViewDocumentLink>
  );
};

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
