import { Link } from 'react-router';
import React from 'react';
import { shallow } from 'enzyme';

import { CurrentLocationLink } from '#app/Layout/index.js';
import { EntitySchema } from '#shared/types/entityType.js';

import { ViewDocumentLink } from '../ViewDocumentLink.js';

let pathname = '/entity/sharedId';
let mockFeatureFlags: { entityViewerV2?: boolean } = {};

const mockUseLocation = jest.fn().mockImplementation(() => ({
  pathname,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: () => mockUseLocation(),
}));

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtomValue: () => ({ features: mockFeatureFlags }),
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
    pathname = '/entity/sharedId';
    mockFeatureFlags = {};
  });

  describe('when on viewer', () => {
    it('should change file name and set page 1 if its in document view', () => {
      const component = renderComponent(entity);
      expect(
        (component.find(CurrentLocationLink).props() as { queryParams: unknown }).queryParams
      ).toEqual({
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

    it('should link to V2 entity path when feature flag is on', () => {
      pathname = 'outside';
      mockFeatureFlags = { entityViewerV2: true };
      const component = renderComponent(entity);
      expect(component.find(Link).props().to).toEqual('/entity/sharedId');
    });
  });
});
