/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryCardsDisplayOptions } from '../LibraryCardsDisplayOptions.js';

const renderCardsOptions = (showThumbnail = true) => {
  const onThumbFrameChange = jest.fn();
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, templates],
        [translationsAtom, translations],
      ]}
    >
      <LibraryCardsDisplayOptions
        showThumbnail={showThumbnail}
        showMetadata
        onShowThumbnailChange={() => undefined}
        onShowMetadataChange={() => undefined}
        thumbFrame="landscape"
        onThumbFrameChange={onThumbFrameChange}
      />
    </TestAtomStoreProvider>
  );
  return { onThumbFrameChange };
};

describe('LibraryCardsDisplayOptions', () => {
  it('offers landscape and portrait while thumbnails are on, not a library image fit', () => {
    const { onThumbFrameChange } = renderCardsOptions();
    expect(screen.getByRole('menuitemcheckbox', { name: /Landscape/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Portrait/ }));
    expect(onThumbFrameChange).toHaveBeenCalledWith('portrait');
    expect(screen.queryByText('Image fit')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemcheckbox', { name: /Cover/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemcheckbox', { name: /Contain/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemcheckbox', { name: /Auto/ })).not.toBeInTheDocument();
  });

  it('hides the thumbnail frame when thumbnails are off', () => {
    renderCardsOptions(false);
    expect(screen.queryByRole('menuitemcheckbox', { name: /Landscape/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Image fit')).not.toBeInTheDocument();
  });

  it('checks portrait when no thumbFrame is passed', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <LibraryCardsDisplayOptions
          showThumbnail
          showMetadata
          onShowThumbnailChange={() => undefined}
          onShowMetadataChange={() => undefined}
        />
      </TestAtomStoreProvider>
    );
    expect(screen.getByRole('menuitemcheckbox', { name: /Portrait/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('menuitemcheckbox', { name: /Landscape/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });
});
