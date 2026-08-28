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
  Map: ({ height, showControls }: { height?: number; showControls?: boolean }) => (
    <div
      data-testid="map"
      data-height={height}
      data-show-controls={showControls === undefined ? 'undefined' : String(showControls)}
    />
  ),
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  MediaPlayer: ({ height }: { height?: number | string }) => (
    <div data-testid="media-player" data-height={height} />
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
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

  it('renders geolocation inherited values with compact density', () => {
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'e1',
            inheritedType: 'geolocation',
            inheritedValue: [{ value: { lat: 1, lon: 2 } }],
          },
        ],
        'e1'
      )
    );
    expect(screen.getByTestId('map')).toHaveAttribute('data-height', '160');
    expect(screen.getByTestId('map')).toHaveAttribute('data-show-controls', 'false');
  });

  it('renders media inherited values with compact density', () => {
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
    expect(screen.getByTestId('media-player')).toHaveAttribute('data-height', '140');
  });

  it('renders image inherited values with default density', () => {
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
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/api/files/photo.png');
    expect(img.className).toContain('max-h-96');
    expect(img.className).not.toContain('max-h-32');
  });

  it('renders inherited relationship values as entity pills with overlay handler', () => {
    const onOpenEntity = jest.fn();
    renderCell(
      inheritedCellContent(
        [
          {
            value: 'person-1',
            inheritedType: 'relationship',
            inheritedValue: [
              { value: 'city-1', label: 'Quito' },
              { value: 'city-2', label: 'Guayaquil' },
            ],
          },
        ],
        'person-1',
        { onOpenEntity, inheritTargetTemplateId: 'city-tmpl' }
      )
    );
    expect(screen.getByRole('button', { name: 'Quito' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guayaquil' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Quito' }).click();
    expect(onOpenEntity).toHaveBeenCalledWith({
      sharedId: 'city-1',
      title: 'Quito',
      templateId: 'city-tmpl',
    });
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
