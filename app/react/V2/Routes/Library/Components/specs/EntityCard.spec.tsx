/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { EntityCard, type EntityCardField } from '../EntityCard.js';

const defaultFields: EntityCardField[] = [{ id: 'country', label: 'Country', value: 'Spain' }];

const renderCard = ({
  selected = false,
  showThumbnail = true,
  fields = defaultFields,
  onSelect,
  onFocusProperty,
}: {
  selected?: boolean;
  showThumbnail?: boolean;
  fields?: EntityCardField[];
  onSelect?: () => void;
  onFocusProperty?: (fieldKey: string) => void;
} = {}) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <EntityCard
          title="Case file"
          templateId="template1"
          fields={fields}
          selected={selected}
          showThumbnail={showThumbnail}
          onSelect={onSelect}
          onFocusProperty={onFocusProperty}
          viewHref="/entityv2/abc"
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('EntityCard', () => {
  it('renders title, metadata and view link', () => {
    renderCard();
    expect(screen.getByText('Case file')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/en/entityv2/abc');
  });

  it('marks the card as selected', () => {
    renderCard({ selected: true });
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });

  it('always reserves the thumbnail slot when thumbnails are on', () => {
    renderCard();
    expect(screen.getByTestId('entity-quiet-mark')).toBeInTheDocument();
  });

  it('hides the thumbnail slot when thumbnails are off', () => {
    renderCard({ showThumbnail: false });
    expect(screen.queryByTestId('entity-quiet-mark')).not.toBeInTheDocument();
  });

  it('opens a media field without selecting the card', () => {
    const onSelect = jest.fn();
    const onFocusProperty = jest.fn();
    renderCard({
      onSelect,
      onFocusProperty,
      fields: [
        { id: 'recording', label: 'Recording', value: 'hearing.mp4', interactive: true },
        { id: 'country', label: 'Country', value: 'Spain' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'hearing.mp4' }));
    expect(onFocusProperty).toHaveBeenCalledWith('recording');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
