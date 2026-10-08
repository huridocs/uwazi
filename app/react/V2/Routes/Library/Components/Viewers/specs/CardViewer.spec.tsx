/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import {
  PORTRAIT_CARD_GRID_CLASS,
  LANDSCAPE_THUMB_HEIGHT_CLASS,
} from '../../libraryCardDisplay.js';
import { CardViewer } from '../CardViewer.js';

const templates = [
  {
    _id: 'template1',
    name: 'Hearing',
    properties: [
      {
        _id: 'p-cover',
        name: 'cover',
        label: 'Cover',
        type: 'image' as const,
        showInCard: true,
        style: 'contain',
      },
      {
        _id: 'p-country',
        name: 'country',
        label: 'Country',
        type: 'select' as const,
        showInCard: true,
      },
    ],
  },
] as Template[];

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'case-1',
    language: 'en',
    title: 'Hearing',
    template: 'template1',
    creationDate: 1,
    metadata: {
      cover: [{ value: '/api/files/cover.png' }],
      country: [{ value: 'ar', label: 'Argentina' }],
    },
  },
];

const renderCards = ({
  showThumbnail = true,
  onFocusProperty,
  style = 'contain',
  thumbFrame,
  thumbSize,
}: {
  showThumbnail?: boolean;
  onFocusProperty?: (sharedId: string, fieldKey: string) => void;
  style?: 'contain' | 'cover';
  thumbFrame?: 'landscape' | 'portrait';
  thumbSize?: 's' | 'm' | 'l';
} = {}) => {
  const baseTemplate = templates[0]!;
  const viewerTemplates = [
    {
      ...baseTemplate,
      properties: (baseTemplate.properties ?? []).map(property =>
        property.name === 'cover' ? { ...property, style } : property
      ),
    },
  ] as Template[];
  return render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, viewerTemplates],
          [translationsAtom, translations],
        ]}
      >
        <CardViewer
          rows={rows}
          totalRows={1}
          onSelect={() => undefined}
          onFocusProperty={onFocusProperty}
          entityBasePath="/entityv2"
          onLoadMore={() => undefined}
          showThumbnail={showThumbnail}
          showMetadata
          thumbFrame={thumbFrame}
          thumbSize={thumbSize}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );
};

describe('CardViewer thumbnail fit', () => {
  it('uses contain object-fit when the template image property is Fit', () => {
    renderCards({ style: 'contain' });
    expect(document.querySelector('img')).toHaveClass('object-contain');
  });

  it('uses cover object-fit when the template image property is Fill', () => {
    renderCards({ style: 'cover' });
    expect(document.querySelector('img')).toHaveClass('object-cover');
  });
});

const cardGrid = () => screen.getAllByText('Hearing')[0]?.closest('.grid');

const expectPortraitColumns = (thumbSize: 's' | 'm' | 'l') => {
  const view = renderCards({ thumbFrame: 'portrait', thumbSize });
  expect(cardGrid()).toHaveClass(...PORTRAIT_CARD_GRID_CLASS[thumbSize].split(' '));
  view.unmount();
};

describe('CardViewer thumbnail size', () => {
  it('hangs small portrait cards in the narrowest columns', () => {
    expectPortraitColumns('s');
  });

  it('hangs medium portrait cards in the middle column count', () => {
    expectPortraitColumns('m');
  });

  it('hangs large portrait cards in the widest columns', () => {
    expectPortraitColumns('l');
  });

  it('draws a large landscape band at the large height', () => {
    renderCards({ thumbFrame: 'landscape', thumbSize: 'l' });
    expect(document.querySelector('img')?.parentElement).toHaveClass(
      LANDSCAPE_THUMB_HEIGHT_CLASS.l
    );
    expect(document.querySelector('img')?.parentElement).not.toHaveClass('aspect-[3/4]');
  });
});

describe('CardViewer hidden thumbnail', () => {
  it('renders the visual property as a filename row and focuses it on click', () => {
    const onFocusProperty = jest.fn();
    renderCards({ showThumbnail: false, onFocusProperty });
    expect(document.querySelector('img')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-quiet-mark')).not.toBeInTheDocument();
    expect(screen.getByText('Cover')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'cover.png' }));
    expect(onFocusProperty).toHaveBeenCalledWith('case-1', 'cover');
  });

  it('does not duplicate the visual property in the body while the thumbnail is shown', () => {
    renderCards({ showThumbnail: true });
    expect(document.querySelector('img')).toHaveAttribute('src', '/api/files/cover.png');
    expect(screen.queryByText('Cover')).not.toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });
});
