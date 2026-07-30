/** @jest-environment jsdom */
/* eslint-disable react/no-multi-comp */
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
    title,
    target,
    rel,
  }: {
    children: React.ReactNode;
    to: string;
    title?: string;
    target?: string;
    rel?: string;
  }) => (
    <a href={to} title={title} target={target} rel={rel}>
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

const sectionForLabel = (label: string): HTMLElement => {
  const labelEl = screen.getByText(label);
  const section = labelEl.closest('div.overflow-hidden');
  if (!(section instanceof HTMLElement)) {
    throw new Error(`expected section for ${label}`);
  }
  return section;
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
  it('shows Document, long fields, and Details, and hides Relationships when empty', () => {
    const withoutRels: Entity = {
      ...entity,
      metadata: {
        summary: entity.metadata?.summary,
        code: entity.metadata?.code,
        notes: entity.metadata?.notes,
      },
    };

    renderRecord(withoutRels);

    expect(screen.getByRole('heading', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByText('Report.pdf')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Creation Date' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Edit Date' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Code' })).toBeInTheDocument();
    expect(within(table).getByText('ABC')).toBeInTheDocument();
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
  });

  it('hides empty preview field and still shows Document when entity has a file', () => {
    renderRecord();

    expect(screen.queryByRole('heading', { name: 'Previewg' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  });

  it('shows inheriting connections under Relationships with via and inherits', () => {
    renderRecord();

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Relationshipa')).toBeInTheDocument();
    expect(screen.getByText('Relationshipb')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipb' })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Relationshipa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Relationshipb' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/via/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/inherits/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Relationshipc' })).toBeInTheDocument();
  });

  it('shows inheriting connections under Relationships with inherited body and map', () => {
    renderRecord();

    const rela = sectionForLabel('Relationshipa');
    expect(rela).toHaveTextContent('Inherited long text content for relationship a');
    expect(within(rela).getByRole('link', { name: /A1/i })).toBeInTheDocument();

    const relb = sectionForLabel('Relationshipb');
    expect(within(relb).getByTestId('map')).toBeInTheDocument();
    expect(within(relb).getByRole('link', { name: /A1/i })).toBeInTheDocument();

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipb' })).not.toBeInTheDocument();
  });

  it('shows own map and inherited location under Relationships', () => {
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

    expect(screen.queryByText('Grouped geolocation properties')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Own location' })).toBeInTheDocument();
    expect(within(sectionForLabel('Own location')).getByTestId('map')).toHaveAttribute(
      'data-marker-count',
      '1'
    );

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    const inherited = sectionForLabel('Inherited location');
    expect(within(inherited).getByTestId('map')).toHaveAttribute('data-marker-count', '1');
    expect(within(inherited).getByRole('link', { name: /A1/i })).toBeInTheDocument();
  });

  it('shows own map and hides empty inherited location', () => {
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

    expect(screen.getByRole('heading', { name: 'Own location' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
    expect(screen.queryByText('Inherited location')).not.toBeInTheDocument();
  });

  it('shows separate maps for each inherited location', () => {
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

    const relA = sectionForLabel('Inherited location A');
    const relB = sectionForLabel('Inherited location B');
    expect(within(relA).getByTestId('map')).toHaveAttribute('data-marker-count', '1');
    expect(within(relB).getByTestId('map')).toHaveAttribute('data-marker-count', '2');
    expect(within(relA).getByRole('link', { name: /A1/i })).toBeInTheDocument();
    expect(within(relB).getByRole('link', { name: /B1/i })).toBeInTheDocument();
    expect(within(relA).queryByRole('link', { name: /B1/i })).not.toBeInTheDocument();
    expect(within(relB).queryByRole('link', { name: /A1/i })).not.toBeInTheDocument();
  });

  it('shows external-link control only on Details relationship rows', () => {
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
