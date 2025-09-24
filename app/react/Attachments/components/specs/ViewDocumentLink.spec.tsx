import { Link } from 'react-router';
import React from 'react';
import { shallow } from 'enzyme';

// @ts-expect-error TS(2307): Cannot find module '../../Layout.js' or its corres... Remove this comment to see the full error message
import { CurrentLocationLink } from '../../Layout.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';

import { ViewDocumentLink } from '../ViewDocumentLink';

let pathname = 'entity/';

const mockUseLocation = jest.fn().mockImplementation(() => ({
  pathname: `?page=${pathname}`,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: () => mockUseLocation(),
}));
const renderComponent = (entity: EntitySchema) => {
  mockUseLocation.mockReturnValue({ pathname });
  return shallow(
    <ViewDocumentLink entity={entity} filename="file.pdf">
      ' '
    </ViewDocumentLink>
  );
};

describe('ViewDocumentLink', () => {
  const entity: EntitySchema = { _id: 'id', sharedId: 'sharedId' };

  beforeEach(() => {
    pathname = 'entity/';
  });

  describe('when on viewer', () => {
    it('should change file name and set page 1 if its in document view', () => {
      const component = renderComponent(entity);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(component.find(CurrentLocationLink).props().queryParams).toEqual({
        file: 'file.pdf',
        page: 1,
      });
    });

    it('should link to the specific file if its on the relationships view', () => {
      pathname = '/entity/entitySharedId/relationships';
      const component = renderComponent(entity);
      expect(component.find(Link).props().to).toEqual('/entity/sharedId?file=file.pdf');
    });
  });

  describe('when outside viewer route', () => {
    it('should link to viewer with specific file', () => {
      pathname = 'outside';
      const component = renderComponent(entity);
      expect(component.find(Link).props().to).toEqual('/entity/sharedId?file=file.pdf');
    });
  });
});
