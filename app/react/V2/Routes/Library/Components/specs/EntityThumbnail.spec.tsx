/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { EntityThumbnail } from '../EntityThumbnail.js';
import type { ThumbFit, ThumbFrame, ThumbnailKind } from '../libraryCardDisplay.js';

const thumbnailImage = () => document.querySelector('img');

const renderThumb = ({
  src,
  kind,
  fit,
  frame,
  tint,
  className,
}: {
  src?: string;
  kind?: ThumbnailKind;
  fit?: ThumbFit;
  frame?: ThumbFrame;
  tint?: string;
  className?: string;
}) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, templates],
        [translationsAtom, translations],
      ]}
    >
      <EntityThumbnail
        src={src}
        kind={kind}
        fit={fit}
        frame={frame}
        tint={tint}
        className={className}
      />
    </TestAtomStoreProvider>
  );

describe('EntityThumbnail', () => {
  it('crops a landscape document to the top of the page on a shadowed sheet', () => {
    renderThumb({
      src: '/api/files/doc-1.jpg',
      kind: 'document',
      frame: 'landscape',
      className: 'h-24',
    });
    expect(thumbnailImage()).toHaveAttribute('src', '/api/files/doc-1.jpg');
    expect(thumbnailImage()).toHaveClass('w-full');
    expect(thumbnailImage()).not.toHaveClass('object-contain');
    expect(screen.getByTestId('document-preview-sheet')).toHaveClass('shadow-sm');
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.queryByTestId('entity-quiet-mark')).not.toBeInTheDocument();
  });

  it('covers an image when fit is cover', () => {
    renderThumb({ src: '/api/files/cover.png', kind: 'image', fit: 'cover' });
    expect(thumbnailImage()).toHaveClass('object-cover');
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('mats an image when fit is contain', () => {
    renderThumb({ src: '/api/files/cover.png', kind: 'image', fit: 'contain' });
    expect(thumbnailImage()).toHaveClass('object-contain');
  });

  it('renders QuietMark when there is no src', () => {
    renderThumb({ tint: '#6a5acd', className: 'h-24' });
    expect(thumbnailImage()).not.toBeInTheDocument();
    expect(screen.getByTestId('entity-quiet-mark')).toBeInTheDocument();
  });

  it('falls back to QuietMark when the image fails to load', () => {
    renderThumb({ src: '/api/files/missing.png', tint: '#6a5acd', kind: 'image' });
    fireEvent.error(thumbnailImage()!);
    expect(thumbnailImage()).not.toBeInTheDocument();
    expect(screen.getByTestId('entity-quiet-mark')).toBeInTheDocument();
  });
});
