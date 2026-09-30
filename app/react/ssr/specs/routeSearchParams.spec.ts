/**
 * @jest-environment jsdom
 */
import React from 'react';
import { searchParamsWithChildQuery } from '../routeSearchParams.js';

const library = React.createElement(
  'div',
  null,
  React.createElement('div', { params: { q: '(includeUnpublished:!t)' } })
);

describe('searchParamsWithChildQuery', () => {
  it('uses the child query when the url has none', () => {
    expect(searchParamsWithChildQuery({ sharedId: 'a' }, library, undefined)).toEqual({
      sharedId: 'a',
      q: '(includeUnpublished:!t)',
    });
  });

  it('keeps a url query', () => {
    expect(searchParamsWithChildQuery({}, library, '(unpublished:!t)')).toEqual({});
  });

  it('keeps a query already on the route', () => {
    expect(searchParamsWithChildQuery({ q: '(limit:10)' }, library, undefined)).toEqual({
      q: '(limit:10)',
    });
  });

  it('leaves params unchanged when the child has no query', () => {
    const element = React.createElement('div', null, React.createElement('div'));
    expect(searchParamsWithChildQuery({ sharedId: 'a' }, element, undefined)).toEqual({
      sharedId: 'a',
    });
  });
});
