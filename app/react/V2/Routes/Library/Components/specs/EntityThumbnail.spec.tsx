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

  describe('audio thumbnail', () => {
    it('renders a cream audio header with a blue equalizer icon', () => {
      renderThumb({
        src: '/api/files/hearing.mp3',
        kind: 'audio',
        className: 'h-[142px] overflow-hidden rounded',
      });
      expect(thumbnailImage()).not.toBeInTheDocument();
      expect(document.querySelector('audio')).not.toBeInTheDocument();
      expect(document.querySelector('video')).not.toBeInTheDocument();
      const thumb = screen.getByTestId('entity-audio-thumb');
      expect(thumb).toHaveClass(
        'bg-warm',
        'h-[142px]',
        'rounded',
        'flex',
        'items-center',
        'justify-center'
      );
      expect(screen.getByTestId('entity-audio-equalizer')).toHaveClass('text-blue-600');
      expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
    });

    it('shows the audio play mark only on hover of the full thumbnail', () => {
      renderThumb({ src: '/api/files/hearing.mp3', kind: 'audio' });
      const play = screen.getByRole('button', { name: 'Play audio' });
      expect(play).toHaveAttribute('data-testid', 'entity-audio-thumb');
      expect(play).toHaveClass('group');
      expect(screen.getByTestId('entity-audio-play')).toHaveClass(
        'opacity-0',
        'group-hover:opacity-100'
      );
      expect(screen.queryByText('Play')).not.toBeInTheDocument();
    });

    it('loads and plays the audio only after the play control is clicked', () => {
      renderThumb({ src: '/api/files/hearing.mp3', kind: 'audio' });
      expect(document.querySelector('audio')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));
      const audio = document.querySelector('audio');
      expect(audio).toHaveAttribute('src', '/api/files/hearing.mp3');
      expect(audio).toHaveAttribute('autoplay');
      expect(screen.queryByRole('button', { name: 'Play audio' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('entity-audio-play')).not.toBeInTheDocument();
      expect(screen.getByTestId('entity-audio-thumb')).toHaveClass('bg-warm');
      expect(screen.getByTestId('entity-audio-equalizer')).toHaveClass('text-blue-600');
    });
  });

  it('renders a black video header with a circular play button and does not load the video', () => {
    renderThumb({ src: '/api/files/hearing.mp4', kind: 'video', className: 'h-[142px]' });
    expect(document.querySelector('video')).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    const play = screen.getByRole('button', { name: 'Play video' });
    expect(play).toHaveClass('group', 'bg-black');
    expect(play).not.toHaveClass('bg-warm');
    expect(screen.getByTestId('entity-video-play')).toHaveClass(
      'rounded-full',
      'bg-white',
      'opacity-0',
      'group-hover:opacity-100'
    );
    expect(screen.queryByTestId('entity-audio-equalizer')).not.toBeInTheDocument();
  });

  it('shows an image field as an image, not a video poster', () => {
    renderThumb({
      src: '/api/files/17900782341876n5ao2986x.png',
      kind: 'image',
      className: 'h-[142px]',
    });
    expect(thumbnailImage()).toHaveAttribute('src', '/api/files/17900782341876n5ao2986x.png');
    expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
  });

  it('loads and plays the video only after the play control is clicked', () => {
    renderThumb({ src: '/api/files/hearing.mp4', kind: 'video' });
    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(document.querySelector('video')).toHaveAttribute('src', '/api/files/hearing.mp4');
  });
});
