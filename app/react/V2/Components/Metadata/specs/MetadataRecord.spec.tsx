/** @jest-environment jsdom */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { createStore, Provider } from 'jotai';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { focusMetadataFieldAtom } from '../focusMetadataFieldAtom.js';
import {
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
} from '../metadataPropertyLayout.js';
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

const resizeObservers: Array<{
  callback: ResizeObserverCallback;
  observe: () => void;
  unobserve: () => void;
  disconnect: () => void;
}> = [];
let mockClientWidth = 0;

class ResizeObserverMock {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

const relatedTemplate = {
  _id: 'related-tmpl',
  name: 'Related',
  properties: [
    { _id: 'inherited-text-prop', name: 'body', type: 'text' as const, label: 'Body text' },
    { _id: 'inherited-geo-prop', name: 'loc', type: 'geolocation' as const, label: 'Location' },
  ],
};

const relatedEntityTemplate = {
  _id: 'person-tmpl',
  name: 'Person',
  color: '#2563eb',
  properties: [],
};

const template = {
  _id: 'tmpl1',
  name: 'Template',
  color: '#c03b22',
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
  relations: [
    {
      entity: 'linked-c',
      entityData: { title: 'Charles', template: 'person-tmpl' },
    },
    {
      entity: 'linked-d',
      entityData: { title: 'Diana', template: 'person-tmpl' },
    },
  ],
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

const withoutRels: Entity = {
  ...entity,
  metadata: {
    summary: entity.metadata?.summary,
    code: entity.metadata?.code,
    notes: entity.metadata?.notes,
  },
};

const renderRecord = (
  entityOverride: Entity = entity,
  options: { showDocumentPreview?: boolean } = {}
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [templatesAtom, [template, relatedTemplate, relatedEntityTemplate]],
        [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
      ]}
    >
      <MetadataRecord entity={entityOverride} showDocumentPreview={options.showDocumentPreview} />
    </TestAtomStoreProvider>
  );

const fieldEl = (name: string): HTMLElement => {
  const el = document.querySelector(`[data-field-key="${name}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`expected field ${name}`);
  }
  return el;
};

describe('MetadataRecord', () => {
  beforeEach(() => {
    mockClientWidth = 0;
    resizeObservers.length = 0;
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => mockClientWidth,
    });
  });

  // eslint-disable-next-line max-statements
  it('shows system dates and packs template fields in masonry', () => {
    renderRecord(withoutRels);

    expect(screen.queryByRole('heading', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.queryByText('Report.pdf')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Code' })).toBeInTheDocument();
    expect(screen.getByText('ABC')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument();
    expect(screen.getByTestId('entity-system-dates')).toHaveTextContent(/Created/);
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();

    expect(fieldEl('code').className).toContain(COMPACT_METADATA_FIELD_LAYOUT);
    expect(fieldEl('summary').className).toContain(FULL_ROW_METADATA_FIELD_LAYOUT);
    expect(fieldEl('notes').className).toContain(FULL_ROW_METADATA_FIELD_LAYOUT);
  });

  // eslint-disable-next-line max-statements
  it('packs image without fullWidth as compact in the masonry wrap', () => {
    const imageTemplate = {
      ...template,
      properties: [
        {
          _id: 'p-text',
          name: 'summary',
          type: 'text' as const,
          label: 'Summary',
          showInCard: true,
        },
        { _id: 'p-short', name: 'code', type: 'text' as const, label: 'Code' },
        {
          _id: 'p-img',
          name: 'photo',
          type: 'image' as const,
          label: 'Image',
          style: 'contain' as const,
          showInCard: true,
        },
      ],
    };
    const imageEntity: Entity = {
      ...withoutRels,
      metadata: {
        summary: [{ value: 'Shown in cards' }],
        code: [{ value: 'ABC' }],
        photo: [{ value: '/plant.jpg', alt: 'plant' }],
      },
      documents: [],
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [imageTemplate, relatedTemplate, relatedEntityTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
        ]}
      >
        <MetadataRecord entity={imageEntity} />
      </TestAtomStoreProvider>
    );

    const headings = screen.getAllByRole('heading').map(heading => heading.textContent);
    expect(headings.indexOf('Summary')).toBeLessThan(headings.indexOf('Image'));
    expect(headings).not.toContain('Details');
    expect(screen.getByTestId('entity-system-dates')).toBeInTheDocument();
    expect(fieldEl('photo').className).toContain(COMPACT_METADATA_FIELD_LAYOUT);
    expect(fieldEl('code').className).toContain(COMPACT_METADATA_FIELD_LAYOUT);
  });

  // eslint-disable-next-line max-statements
  it('repacks image and media onto one row when the panel widens', async () => {
    mockClientWidth = 300;
    const imageTemplate = {
      ...template,
      properties: [
        {
          _id: 'p-img',
          name: 'photo',
          type: 'image' as const,
          label: 'Image',
          style: 'contain' as const,
        },
        { _id: 'p-med', name: 'clip', type: 'media' as const, label: 'Media' },
      ],
    };
    const imageEntity: Entity = {
      ...withoutRels,
      metadata: {
        photo: [{ value: '/plant.jpg', alt: 'plant' }],
        clip: [{ value: '/a.mp4' }],
      },
      documents: [],
    };

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [imageTemplate, relatedTemplate, relatedEntityTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
        ]}
      >
        <MetadataRecord entity={imageEntity} />
      </TestAtomStoreProvider>
    );

    await waitFor(() => {
      expect(
        fieldEl('photo').closest('[data-property-row]')?.getAttribute('data-property-row')
      ).toBe('photo');
      expect(
        fieldEl('clip').closest('[data-property-row]')?.getAttribute('data-property-row')
      ).toBe('clip');
    });

    mockClientWidth = 700;
    const [observer] = resizeObservers;
    if (!observer) {
      throw new Error('expected ResizeObserver');
    }
    act(() => {
      observer.callback(
        [
          {
            contentRect: { width: 700, height: 100 } as DOMRectReadOnly,
            target: document.querySelector('[data-testid="metadata-record"]') as Element,
          } as ResizeObserverEntry,
        ],
        observer
      );
    });

    await waitFor(() => {
      expect(
        fieldEl('photo').closest('[data-property-row]')?.getAttribute('data-property-row')
      ).toBe('photo clip');
    });
  });

  it('scrolls and flashes a masonry field when focusMetadataFieldAtom matches', () => {
    jest.useFakeTimers();
    Element.prototype.scrollIntoView = jest.fn();

    render(
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [template, relatedTemplate, relatedEntityTemplate]],
          [relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]],
          [focusMetadataFieldAtom, { fieldKey: 'code' }],
        ]}
      >
        <MetadataRecord entity={withoutRels} />
      </TestAtomStoreProvider>
    );

    const codeCard = fieldEl('code');
    expect(codeCard).toHaveClass('flash-highlight');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    expect(codeCard).not.toHaveClass('flash-highlight');
    jest.useRealTimers();
  });

  it('retains focus atom while field is missing (does not clear shared atom early)', () => {
    jest.useFakeTimers();

    const store = createStore();
    store.set(templatesAtom, [template, relatedTemplate]);
    store.set(relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]);
    store.set(focusMetadataFieldAtom, { fieldKey: 'missing-field' });

    render(
      <Provider store={store}>
        <MetadataRecord entity={withoutRels} />
      </Provider>
    );

    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'missing-field' });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'missing-field' });

    jest.useRealTimers();
  });

  it('clears focus atom when entity sharedId changes', () => {
    jest.useFakeTimers();

    const store = createStore();
    store.set(templatesAtom, [template, relatedTemplate]);
    store.set(relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]);
    store.set(focusMetadataFieldAtom, { fieldKey: 'code' });

    const { rerender } = render(
      <Provider store={store}>
        <MetadataRecord entity={withoutRels} />
      </Provider>
    );

    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'code' });

    rerender(
      <Provider store={store}>
        <MetadataRecord entity={{ ...withoutRels, _id: 'e2', sharedId: 's2', title: 'Other' }} />
      </Provider>
    );

    expect(store.get(focusMetadataFieldAtom)).toBeNull();
    jest.useRealTimers();
  });

  it('clears focus atom on unmount only after this instance applied it', () => {
    const store = createStore();
    store.set(templatesAtom, [template, relatedTemplate]);
    store.set(relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]);
    store.set(focusMetadataFieldAtom, { fieldKey: 'code' });

    const { unmount } = render(
      <Provider store={store}>
        <MetadataRecord entity={withoutRels} />
      </Provider>
    );

    unmount();
    expect(store.get(focusMetadataFieldAtom)).toBeNull();
  });

  it('does not clear focus on unmount when this instance never applied it', () => {
    jest.useFakeTimers();
    const store = createStore();
    store.set(templatesAtom, [template, relatedTemplate]);
    store.set(relationshipTypesAtom, [{ _id: 'rel-type-1', name: 'Relates to' }]);
    store.set(focusMetadataFieldAtom, { fieldKey: 'missing-field' });

    const { unmount } = render(
      <Provider store={store}>
        <MetadataRecord entity={withoutRels} />
      </Provider>
    );

    unmount();
    expect(store.get(focusMetadataFieldAtom)).toEqual({ fieldKey: 'missing-field' });
    jest.useRealTimers();
  });

  it('hides empty preview field and does not show Document', () => {
    renderRecord();

    expect(screen.queryByRole('heading', { name: 'Previewg' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  });

  it('omits the preview card on the entity page', () => {
    renderRecord({
      ...entity,
      documents: [
        {
          _id: 'doc-1',
          filename: 'judgment.pdf',
          originalname: 'Velasquez.pdf',
          mimetype: 'application/pdf',
          size: 218112,
          language: 'eng',
        },
      ],
      metadata: {
        ...entity.metadata,
        previewg: [{ value: '/batman.jpg' }],
      },
    });

    expect(screen.queryByRole('heading', { name: 'Previewg' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-field-key="previewg"]')).toBeNull();
  });

  it('shows a compact document card in overlay preview mode', () => {
    renderRecord(
      {
        ...entity,
        documents: [
          {
            _id: 'doc-1',
            filename: 'judgment.pdf',
            originalname: 'Velasquez.pdf',
            mimetype: 'application/pdf',
            size: 218112,
            language: 'eng',
          },
        ],
        metadata: {
          ...entity.metadata,
          previewg: [{ value: '/batman.jpg' }],
        },
      },
      { showDocumentPreview: true }
    );

    expect(screen.getByRole('heading', { name: 'Previewg' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Document' })).not.toBeInTheDocument();
    const headings = screen.getAllByRole('heading').map(heading => heading.textContent);
    expect(headings.indexOf('Notes')).toBeLessThan(headings.indexOf('Previewg'));
    expect(headings.indexOf('Previewg')).toBeLessThan(headings.indexOf('Relationshipc'));
    expect(fieldEl('previewg').className).toContain(COMPACT_METADATA_FIELD_LAYOUT);
  });

  it('shows inheriting connections in template order without a Relationships heading', () => {
    renderRecord();

    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
    expect(screen.getByText('Relationshipa')).toBeInTheDocument();
    expect(screen.queryByText('Relationshipb')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipa' })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Relationshipa' })).not.toBeInTheDocument();
    expect(screen.getAllByText(/via/).length).toBeGreaterThan(0);
    expect(screen.getByText(/inherits/)).toHaveTextContent('Body text, Location');
    expect(screen.getByRole('heading', { name: 'Relationshipc' })).toBeInTheDocument();
    const headings = screen.getAllByRole('heading').map(heading => heading.textContent);
    expect(headings.indexOf('Notes')).toBeLessThan(headings.indexOf('Relationshipc'));
    expect(headings).not.toContain('Details');
    expect(screen.getByTestId('entity-system-dates')).toBeInTheDocument();
  });

  it('shows inheriting connections with inherited body and map', () => {
    renderRecord();

    const rela = sectionForLabel('Relationshipa');
    expect(rela).toHaveTextContent('Inherited long text content for relationship a');
    expect(within(rela).getByTestId('map')).toBeInTheDocument();
    expect(within(rela).getByRole('link', { name: /A1/i })).toBeInTheDocument();
    expect(within(rela).getByRole('columnheader', { name: 'Body text' })).toBeInTheDocument();
    expect(within(rela).getByRole('columnheader', { name: 'Location' })).toBeInTheDocument();

    expect(screen.getByText(/inherits/)).toHaveTextContent('Body text, Location');
    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Relationshipa' })).not.toBeInTheDocument();
  });

  it('shows own map and inherited location in property order', () => {
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

    expect(screen.getByText('Grouped geolocation properties')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Own location' })).not.toBeInTheDocument();
    const groupedMap = within(
      screen
        .getByText('Grouped geolocation properties')
        .closest('div.overflow-hidden') as HTMLElement
    ).getByTestId('map');
    expect(groupedMap).toHaveAttribute('data-marker-count', '2');

    expect(screen.queryByText('Relationships')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inherited location' })).not.toBeInTheDocument();
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

    expect(screen.getByText('Grouped geolocation properties')).toBeInTheDocument();
    expect(
      within(sectionForLabel('Grouped geolocation properties')).getByTestId('map')
    ).toHaveAttribute('data-marker-count', '1');
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
          relationType: 'rel-type-2',
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
          [
            relationshipTypesAtom,
            [
              { _id: 'rel-type-1', name: 'Relates to' },
              { _id: 'rel-type-2', name: 'Also relates' },
            ],
          ],
        ]}
      >
        <MetadataRecord entity={geoGroupEntity} />
      </TestAtomStoreProvider>
    );

    expect(screen.getByText('Grouped geolocation properties')).toBeInTheDocument();
    expect(
      within(sectionForLabel('Grouped geolocation properties')).getByTestId('map')
    ).toHaveAttribute('data-marker-count', '4');

    expect(screen.queryByRole('heading', { name: 'Inherited location A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inherited location B' })).not.toBeInTheDocument();
  });

  it('colors unconstrained relationship pills from the related entity template', () => {
    renderRecord();

    const relationshipd = screen.getByRole('heading', { name: 'Relationshipd' });
    const card = relationshipd.closest('div.overflow-hidden');
    expect(card).toBeInstanceOf(HTMLElement);
    if (!(card instanceof HTMLElement)) {
      return;
    }
    const diana = within(card).getByRole('link', { name: /Diana/i });
    const pill = diana.querySelector('span[title="Diana"]');
    expect(pill?.firstElementChild).toHaveStyle({ backgroundColor: '#2563eb' });
    expect(pill?.firstElementChild).not.toHaveStyle({ backgroundColor: '#c03b22' });
  });
});
