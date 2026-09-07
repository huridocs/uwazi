/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { RelationshipCards } from '../RelationshipCards.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: ({ markers }: { markers?: unknown[] }) => (
    <div data-testid="map" data-marker-count={markers?.length ?? 0} />
  ),
}));

const personTemplate: ClientTemplateSchema = {
  _id: 'person-tmpl',
  name: 'Person',
  properties: [
    { _id: 'country-id', name: 'country', type: 'text', label: 'Country' },
    { _id: 'role-id', name: 'role', type: 'text', label: 'Role' },
  ],
};

const peopleCountryProp: ClientProperty = {
  _id: 'p-country',
  name: 'people_country',
  type: 'relationship',
  label: 'People involved',
  content: 'person-tmpl',
  relationType: 'rel-people',
  inherit: { property: 'country-id', type: 'text' },
};

const peopleRoleProp: ClientProperty = {
  _id: 'p-role',
  name: 'people_role',
  type: 'relationship',
  label: 'Role field',
  content: 'person-tmpl',
  relationType: 'rel-people',
  inherit: { property: 'role-id', type: 'text' },
};

const otherInheritProp: ClientProperty = {
  _id: 'p-other',
  name: 'other_rel',
  type: 'relationship',
  label: 'Other inherit',
  content: 'person-tmpl',
  relationType: 'rel-other',
  inherit: { property: 'country-id', type: 'text' },
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Case',
  template: 'case-tmpl',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  metadata: {
    people_country: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Kenya', label: 'Kenya' }],
      },
    ],
    people_role: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Witness', label: 'Witness' }],
      },
    ],
    other_rel: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Uganda', label: 'Uganda' }],
      },
    ],
  },
};

const field = ({
  id,
  name,
  label,
  title = 'Ada',
}: {
  id: string;
  name: string;
  label: string;
  title?: string;
}): RelationshipMetadataProperty => ({
  _id: id,
  name,
  label,
  type: 'relationship',
  mode: 'related',
  inherited: true,
  values: [{ _id: 'entity-1', title, templateId: 'person-tmpl' }],
});

const renderCards = (
  fields: RelationshipMetadataProperty[],
  templatePropertyById: Map<string, ClientProperty>
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [
          relationshipTypesAtom,
          [
            { _id: 'rel-people', name: 'People' },
            { _id: 'rel-other', name: 'Other link' },
          ],
        ],
      ]}
    >
      <RelationshipCards
        fields={fields}
        translationContext="case-tmpl"
        templatePropertyById={templatePropertyById}
        templates={[personTemplate]}
        entity={entity}
        inheritingOnly
      />
    </TestAtomStoreProvider>
  );

describe('RelationshipCards multi-inherit grouping', () => {
  it('renders one card with N inherit columns for sibling inherits', () => {
    const templatePropertyById = new Map([
      ['p-country', peopleCountryProp],
      ['p-role', peopleRoleProp],
    ]);

    renderCards(
      [
        field({ id: 'p-country', name: 'people_country', label: 'People involved' }),
        field({ id: 'p-role', name: 'people_role', label: 'Role field' }),
      ],
      templatePropertyById
    );

    expect(screen.getByText('People involved')).toBeInTheDocument();
    expect(screen.queryByText('Role field')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Country' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(screen.getByText(/inherits/)).toHaveTextContent('Country, Role');
    expect(screen.getByText('Kenya')).toBeInTheDocument();
    expect(screen.getByText('Witness')).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
  });

  it('keeps separate cards for different group keys', () => {
    const templatePropertyById = new Map([
      ['p-country', peopleCountryProp],
      ['p-other', otherInheritProp],
    ]);

    renderCards(
      [
        field({ id: 'p-country', name: 'people_country', label: 'People involved' }),
        field({ id: 'p-other', name: 'other_rel', label: 'Other inherit' }),
      ],
      templatePropertyById
    );

    expect(screen.getByText('People involved')).toBeInTheDocument();
    expect(screen.getByText('Other inherit')).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(2);
  });

  it('keeps a single inherit column for one inheriting field', () => {
    const templatePropertyById = new Map([['p-country', peopleCountryProp]]);

    renderCards(
      [field({ id: 'p-country', name: 'people_country', label: 'People involved' })],
      templatePropertyById
    );

    const card = screen.getByText('People involved').closest('div.overflow-hidden') as HTMLElement;
    expect(within(card).getByRole('columnheader', { name: 'Country' })).toBeInTheDocument();
    expect(within(card).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(card).getByText('Kenya')).toBeInTheDocument();
  });
});
