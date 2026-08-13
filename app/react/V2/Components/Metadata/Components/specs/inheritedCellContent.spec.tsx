/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { inheritedCellContent } from '../inheritedCellContent.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#app/Map/index.js', () => ({
  Map: () => <div data-testid="map" />,
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  MediaPlayer: () => <div data-testid="media-player" />,
}));

const renderCell = (node: React.ReactNode) =>
  render(
    <TestAtomStoreProvider initialValues={[[localeAtom, 'en']]}>
      <div data-testid="cell">{node}</div>
    </TestAtomStoreProvider>
  );

describe('inheritedCellContent', () => {
  it('renders numeric inherited values', () => {
    renderCell(
      inheritedCellContent(
        [{ value: 'e1', inheritedType: 'numeric', inheritedValue: [{ value: 42 }] }],
        'e1'
      )
    );
    expect(screen.getByTestId('cell')).toHaveTextContent('42');
  });

  it('renders date inherited values', () => {
    renderCell(
      inheritedCellContent(
        [{ value: 'e1', inheritedType: 'date', inheritedValue: [{ value: 1717200000 }] }],
        'e1'
      )
    );
    expect(screen.getByTestId('cell').textContent).not.toBe('');
    expect(screen.getByTestId('cell').textContent).not.toBe('—');
  });

  it('flattens multi-hop relationship inherit before rendering', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedType: 'relationship',
            inheritedValue: [
              {
                value: 'e2',
                inheritedType: 'numeric',
                inheritedValue: [{ value: 7 }],
              },
            ],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByTestId('cell')).toHaveTextContent('7');
  });

  it('renders markdown inherited values', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedType: 'markdown',
            inheritedValue: [{ value: '**bold**' }],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByTestId('cell').querySelector('.no-tailwind')).toBeTruthy();
    expect(screen.getByTestId('cell').innerHTML).toContain('<strong>');
  });

  it('renders media inherited values', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedType: 'media',
            inheritedValue: [{ value: '/api/files/clip.mp4' }],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByTestId('media-player')).toBeInTheDocument();
  });

  it('renders image inherited values', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedType: 'image',
            inheritedValue: [{ value: '/api/files/photo.png' }],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/api/files/photo.png');
  });

  it('falls back to labels for select-like values without type rendering gaps', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedValue: [{ label: 'Tag A', value: null }, { value: 'raw-b' }],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByTestId('cell')).toHaveTextContent('Tag A, raw-b');
  });
});
