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
  Map: () => <div data-testid="map" />,
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
