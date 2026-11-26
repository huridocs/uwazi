/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyFacet } from '../PropertyFacet.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ context, children }: { context?: string; children?: React.ReactNode }) => (
    <span data-translation-context={context}>{children}</span>
  ),
  t: (_context: string, key: string) => key,
}));

describe('PropertyFacet title', () => {
  it('translates the property label in the template context', () => {
    render(
      <PropertyFacet
        property={{ _id: 'prop-country', name: 'country', label: 'Country', type: 'text' }}
        templates={[
          {
            _id: 'tpl-case',
            name: 'Case',
            properties: [{ _id: 'prop-country', name: 'country', label: 'Country', type: 'text' }],
          },
        ]}
        aggregations={{ templates: [], published: { published: 0, restricted: 0 }, properties: {} }}
        filters={{}}
        setFilter={() => undefined}
        locale="es"
        typeIds={[]}
        andFilters={[]}
        onAndFiltersChange={() => undefined}
      />
    );

    expect(screen.getAllByText('Country')[0]).toHaveAttribute(
      'data-translation-context',
      'tpl-case'
    );
  });
});
