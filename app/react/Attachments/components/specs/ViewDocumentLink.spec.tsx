import { Link, RouteComponentProps } from 'react-router';
import React from 'react';
import { shallow } from 'enzyme';

import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

import { ViewDocumentLinkBase as ViewDocumentLink } from '../ViewDocumentLink';

const routerMock = {
  push: () => {},
  replace: () => {},
  go: () => {},
  goBack: () => {},
  goForward: () => {},
  setRouteLeaveHook: () => () => {},
  createPath: (part: any) => part,
  createHref: (href: any) => href,
  isActive: () => true,
};

const renderComponent = (entity: EntitySchema, pathname: string = 'entity/') => {
  const location: RouteComponentProps<any, any>['location'] = {
    pathname,
    search: '',
    hash: '',
    key: 'abc',
    state: {},
    query: {},
    action: 'POP',
  };

  return shallow(
    <ViewDocumentLink
      entity={entity}
      filename="file.pdf"
      location={location}
      params={{ param: 'value' }}
      router={routerMock}
      routes={[]}
    />
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
