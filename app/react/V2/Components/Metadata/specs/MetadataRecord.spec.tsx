/** @jest-environment jsdom */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { MetadataRecord } from '../MetadataRecord';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  I18NLinkV2: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    title?: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: ({ markers }: { markers?: { latitude: number; longitude: number }[] }) => (
    <div data-testid="map" data-marker-count={markers?.length ?? 0} />
  ),
}));

const relatedTemplate = {
  _id: 'related-tmpl',
  name: 'Related',
  properties: [
    { _id: 'inherited-text-prop', name: 'body', type: 'text' as const, label: 'Body text' },
    { _id: 'inherited-geo-prop', name: 'loc', type: 'geolocation' as const, label: 'Location' },
  ],
};

const template = {
  _id: 'tmpl1',
  name: 'Template',
  properties: [
    { _id: 'p-text', name: 'summary', type: 'text' as const, label: 'Summary', showInCard: true },
    { _id: 'p-short', name: 'code', type: 'text' as const, label: 'Code' },
    { _id: 'p-md', name: 'notes', type: 'markdown' as const, label: 'Notes' },
    {
      _id: 'p-preview',
      name: 'previewg',
      type: 'preview' as const,
      label: 'Previewg',
      style: 'cover',
    },
    {
      _id: 'p-rela',
      name: 'relationshipa',
      type: 'relationship' as const,
      label: 'Relationshipa',
      content: 'related-tmpl',
      relationType: 'rel-type-1',
      inherit: { property: 'inherited-text-prop', type: 'text' as const },
    },
    {
      _id: 'p-relb',
      name: 'relationshipb',
      type: 'relationship' as const,
      label: 'Relationshipb',
      content: 'related-tmpl',
      relationType: 'rel-type-1',
      inherit: { property: 'inherited-geo-prop', type: 'geolocation' as const },
    },
    {
      _id: 'p-relc',
      name: 'relationshipc',
      type: 'relationship' as const,
      label: 'Relationshipc',
      showInCard: true,
      relationType: 'rel-type-2',
    },
    {
      _id: 'p-reld',
      name: 'relationshipd',
      type: 'relationship' as const,
      label: 'Relationshipd',
      relationType: 'rel-type-2',
    },
  ],
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 'tmpl1',
  language: 'en',
  creationDate: 1704067200,
  editDate: 1704153600,
  user: 'u1',
  metadata: {
    summary: [{ value: 'x'.repeat(120) }],
    code: [{ value: 'ABC' }],
    notes: [{ value: '## Hello' }],
    previewg: [],
    relationshipa: [
      {
        value: 'linked-a',
        label: 'A1',
        type: 'entity',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Inherited long text content for relationship a' }],
      },
    ],
    relationshipb: [
      {
        value: 'linked-a',
        label: 'A1',
        type: 'entity',
        inheritedType: 'geolocation',
        inheritedValue: [{ value: { lat: 1, lon: 2, label: '' } }],
      },
    ],
    relationshipc: [{ value: 'linked-c', label: 'Charles', type: 'entity' }],
    relationshipd: [{ value: 'linked-d', label: 'Diana', type: 'entity' }],
  },
  documents: [
    {
      _id: 'd1',
      filename: 'file.pdf',
      originalname: 'Report.pdf',
      mimetype: 'application/pdf',
      size: 2048,
    },
  ],
};

const renderRecord = (entityOverride: Entity = entity) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [templatesAtom, [template, relatedTemplate]],
        [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
      ]}
    >
      <MetadataRecord entity={entityOverride} />
    </TestAtomStoreProvider>
  );

describe('MetadataRecord', () => {
  it('renders Document card, leading titled cards, Details table, and omits empty Relationships', () => {
    const withoutRels: Entity = {
      ...entity,
      metadata: {
        summary: entity.metadata?.summary,
        code: entity.metadata?.code,
        notes: entity.metadata?.notes,
      },
    };

    renderRecord(withoutRels);

    expect(screen.getByRole('heading', { level: 4, name: 'Document' })).toBeInTheDocument();
    expect(screen.getByText('Report.pdf')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Details' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Creation Date' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Edit Date' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Code' })).toBeInTheDocument();
    expect(within(table).getByText('ABC')).toBeInTheDocument();
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
  });

  it('does not render empty specialized leading cards and keeps filled preview only in Document', () => {
    renderRecord();

    expect(screen.queryByRole('heading', { level: 4, name: 'Previewg' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Notes' })).toBeInTheDocument();
  });

  it('puts template-inheriting relationships under Relationships with LinkIcon chrome, not MetadataCard h4', () => {
    renderRecord();

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Notes' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 4, name: 'Relationshipa' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 4, name: 'Relationshipb' })
    ).not.toBeInTheDocument();

    const rela = screen.getByText('Relationshipa');
    expect(rela.closest('dt')).toBeTruthy();
    expect(screen.getByText('Relationshipb').closest('dt')).toBeTruthy();
    expect(screen.getAllByText(/via/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/inherits/).length).toBeGreaterThan(0);

    expect(screen.getByRole('heading', { level: 4, name: 'Relationshipc' })).toBeInTheDocument();
  });

  it('keeps inherited terminal content while showing entity link cards for inheriting relationships', () => {
    renderRecord();

    const relaCard = screen.getByText('Relationshipa').closest('[data-field-key="p-rela"]');
    expect(relaCard).toBeInstanceOf(HTMLElement);
    if (!(relaCard instanceof HTMLElement)) {
      throw new Error('expected Relationshipa card');
    }
    expect(relaCard).toHaveTextContent('Inherited long text content for relationship a');

    const relbCard = screen.getByText('Relationshipb').closest('[data-field-key="p-relb"]');
    expect(relbCard).toBeInstanceOf(HTMLElement);
    if (!(relbCard instanceof HTMLElement)) {
      throw new Error('expected Relationshipb card');
    }
    expect(within(relbCard).getByTestId('map')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /A1/i })).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 4, name: 'Relationshipa' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 4, name: 'Relationshipb' })
    ).not.toBeInTheDocument();
  });

  it('attaches geo group terminals to inheriting relationships and keeps own markers as leading', () => {
    const geoGroupTemplate = {
      _id: 'tmpl-geo-group',
      name: 'Geo group template',
      properties: [
        { _id: 'p-geo', name: 'ownloc', type: 'geolocation' as const, label: 'Own location' },
        {
          _id: 'p-rel-geo',
          name: 'inheritedloc',
          type: 'relationship' as const,
          label: 'Inherited location',
          content: 'related-tmpl',
          relationType: 'rel-type-1',
          inherit: { property: 'inherited-geo-prop', type: 'geolocation' as const },
        },
      ],
    };

    const geoGroupEntity: Entity = {
      ...entity,
      _id: 'e-geo-group',
      template: 'tmpl-geo-group',
      metadata: {
        ownloc: [{ value: { lat: 3, lon: 4, label: 'Own' } }],
        inheritedloc: [
          {
            value: 'linked-a',
            label: 'A1',
            type: 'entity',
            inheritedType: 'geolocation',
            inheritedValue: [{ value: { lat: 1, lon: 2, label: '' } }],
          },
        ],
      },
      documents: [],
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [geoGroupTemplate, relatedTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
        ]}
      >
        <MetadataRecord entity={geoGroupEntity} />
      </TestAtomStoreProvider>
    );

    expect(
      screen.queryByRole('heading', { level: 4, name: 'Grouped geolocation properties' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Own location' })).toBeInTheDocument();
    const ownCard = screen.getByRole('heading', { level: 4, name: 'Own location' }).closest(
      '[data-field-key]'
    );
    expect(ownCard).toBeInstanceOf(HTMLElement);
    if (!(ownCard instanceof HTMLElement)) {
      throw new Error('expected Own location card');
    }
    expect(within(ownCard).getByTestId('map')).toHaveAttribute('data-marker-count', '1');

    const relCard = screen.getByText('Inherited location').closest('[data-field-key="p-rel-geo"]');
    expect(relCard).toBeInstanceOf(HTMLElement);
    if (!(relCard instanceof HTMLElement)) {
      throw new Error('expected Inherited location card');
    }
    expect(within(relCard).getByTestId('map')).toHaveAttribute('data-marker-count', '1');
    expect(within(relCard).getByRole('link', { name: /A1/i })).toBeInTheDocument();
  });

  it('keeps own geo map when mixed group inheriting relationship has no linked entities', () => {
    const geoGroupTemplate = {
      _id: 'tmpl-geo-empty-links',
      name: 'Geo empty links template',
      properties: [
        { _id: 'p-geo', name: 'ownloc', type: 'geolocation' as const, label: 'Own location' },
        {
          _id: 'p-rel-geo',
          name: 'inheritedloc',
          type: 'relationship' as const,
          label: 'Inherited location',
          content: 'related-tmpl',
          relationType: 'rel-type-1',
          inherit: { property: 'inherited-geo-prop', type: 'geolocation' as const },
        },
      ],
    };

    const geoGroupEntity: Entity = {
      ...entity,
      _id: 'e-geo-empty-links',
      template: 'tmpl-geo-empty-links',
      metadata: {
        ownloc: [{ value: { lat: 3, lon: 4, label: 'Own' } }],
        inheritedloc: [],
      },
      documents: [],
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [geoGroupTemplate, relatedTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
        ]}
      >
        <MetadataRecord entity={geoGroupEntity} />
      </TestAtomStoreProvider>
    );

    expect(screen.getByRole('heading', { level: 4, name: 'Own location' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
    expect(screen.queryByText('Inherited location')).not.toBeInTheDocument();
  });

  it('gives each inheriting geo relationship only its own markers from a mixed group', () => {
    const geoGroupTemplate = {
      _id: 'tmpl-geo-two-inh',
      name: 'Geo two inheriting template',
      properties: [
        { _id: 'p-geo', name: 'ownloc', type: 'geolocation' as const, label: 'Own location' },
        {
          _id: 'p-rel-geo-a',
          name: 'inheritedloca',
          type: 'relationship' as const,
          label: 'Inherited location A',
          content: 'related-tmpl',
          relationType: 'rel-type-1',
          inherit: { property: 'inherited-geo-prop', type: 'geolocation' as const },
        },
        {
          _id: 'p-rel-geo-b',
          name: 'inheritedlocb',
          type: 'relationship' as const,
          label: 'Inherited location B',
          content: 'related-tmpl',
          relationType: 'rel-type-1',
          inherit: { property: 'inherited-geo-prop', type: 'geolocation' as const },
        },
      ],
    };

    const geoGroupEntity: Entity = {
      ...entity,
      _id: 'e-geo-two-inh',
      template: 'tmpl-geo-two-inh',
      metadata: {
        ownloc: [{ value: { lat: 3, lon: 4, label: 'Own' } }],
        inheritedloca: [
          {
            value: 'linked-a',
            label: 'A1',
            type: 'entity',
            inheritedType: 'geolocation',
            inheritedValue: [{ value: { lat: 1, lon: 2, label: '' } }],
          },
        ],
        inheritedlocb: [
          {
            value: 'linked-b',
            label: 'B1',
            type: 'entity',
            inheritedType: 'geolocation',
            inheritedValue: [
              { value: { lat: 10, lon: 20, label: '' } },
              { value: { lat: 11, lon: 21, label: '' } },
            ],
          },
        ],
      },
      documents: [],
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [geoGroupTemplate, relatedTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
        ]}
      >
        <MetadataRecord entity={geoGroupEntity} />
      </TestAtomStoreProvider>
    );

    const relA = screen
      .getByText('Inherited location A')
      .closest('[data-field-key="p-rel-geo-a"]');
    const relB = screen
      .getByText('Inherited location B')
      .closest('[data-field-key="p-rel-geo-b"]');
    expect(relA).toBeInstanceOf(HTMLElement);
    expect(relB).toBeInstanceOf(HTMLElement);
    if (!(relA instanceof HTMLElement) || !(relB instanceof HTMLElement)) {
      throw new Error('expected both inheriting geo cards');
    }
    expect(within(relA).getByTestId('map')).toHaveAttribute('data-marker-count', '1');
    expect(within(relB).getByTestId('map')).toHaveAttribute('data-marker-count', '2');
    expect(within(relA).getByRole('link', { name: /A1/i })).toBeInTheDocument();
    expect(within(relB).getByRole('link', { name: /B1/i })).toBeInTheDocument();
    expect(within(relA).queryByRole('link', { name: /B1/i })).not.toBeInTheDocument();
    expect(within(relB).queryByRole('link', { name: /A1/i })).not.toBeInTheDocument();
  });

  it('shows external-link icons only on Details ConnectionPills, not Relationships cards', () => {
    renderRecord();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Relationshipd' })).toBeInTheDocument();
    const diana = within(table).getByRole('link', { name: /Diana/i });
    expect(diana).toHaveAttribute('target', '_blank');
    expect(within(diana).getByTestId('connection-external-link-icon')).toBeInTheDocument();

    const icons = screen.queryAllByTestId('connection-external-link-icon');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach(icon => {
      expect(icon.closest('table')).toBeTruthy();
    });
  });
});
