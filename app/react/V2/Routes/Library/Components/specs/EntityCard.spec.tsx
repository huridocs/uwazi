/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { Template } from '#app/apiResponseTypes.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityCard, type EntityCardField } from '../EntityCard.js';
import { thumbnailFromEntity } from '../cardModel.js';
import {
  LANDSCAPE_CARD_FLOOR_CLASS,
  LANDSCAPE_THUMB_HEIGHT_CLASS,
  type ThumbFrame,
  type ThumbSize,
  type ThumbnailKind,
} from '../libraryCardDisplay.js';

const defaultFields: EntityCardField[] = [{ id: 'country', label: 'Country', value: 'Spain' }];

const renderCard = ({
  selected = false,
  showThumbnail = true,
  fields = defaultFields,
  onSelect,
  onFocusProperty,
  thumbnailSrc,
  thumbnailKind,
  thumbFrame,
  thumbSize,
  showMetadata,
}: {
  selected?: boolean;
  showThumbnail?: boolean;
  fields?: EntityCardField[];
  onSelect?: () => void;
  onFocusProperty?: (fieldKey: string) => void;
  thumbnailSrc?: string;
  thumbnailKind?: ThumbnailKind;
  thumbFrame?: ThumbFrame;
  thumbSize?: ThumbSize;
  showMetadata?: boolean;
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
          thumbnailSrc={thumbnailSrc}
          thumbnailKind={thumbnailKind}
          thumbFrame={thumbFrame}
          thumbSize={thumbSize}
          showMetadata={showMetadata}
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

  it('marks the card as selected and does not select its text on shift-click', () => {
    const onSelect = jest.fn();
    renderCard({ selected: true, onSelect });
    const card = screen.getByRole('button', { pressed: true });
    expect(fireEvent.mouseDown(card, { shiftKey: true })).toBe(false);
    expect(fireEvent.mouseDown(card)).toBe(true);
    fireEvent.click(card, { shiftKey: true });
    expect(onSelect).toHaveBeenCalledWith({
      shiftKey: true,
      ctrlKey: false,
      metaKey: false,
    });
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

  it('renders a cream equalizer for an audio media field stored as .mpga, not the video play poster', () => {
    const hjk = {
      _id: 'e1',
      sharedId: 's1',
      title: 'hjk',
      template: 'tmpl1',
      language: 'en',
      creationDate: 1,
      user: 'u1',
      metadata: {
        audio: [{ value: '/api/files/1790078270654848yvqnf86q.mpga' }],
        image: [{ value: '/api/files/17900782341876ri5ao2986x.png' }],
      },
    } as Entity;
    const tmpl = {
      _id: 'tmpl1',
      name: 'Document',
      properties: [
        { _id: 'p-video', name: 'video', label: 'Video', type: 'media', showInCard: true },
        { _id: 'p-audio', name: 'audio', label: 'Audio', type: 'media', showInCard: true },
        { _id: 'p-image', name: 'image', label: 'Image', type: 'image', showInCard: true },
      ],
    } as Template;
    const thumbnail = thumbnailFromEntity(hjk, tmpl);

    renderCard({
      thumbnailSrc: thumbnail.src,
      thumbnailKind: thumbnail.kind,
    });
    expect(screen.getByTestId('entity-audio-thumb')).toHaveClass('bg-warm');
    expect(screen.getByTestId('entity-audio-equalizer')).toHaveClass('text-blue-600');
    expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
    expect(document.querySelector('audio')).not.toBeInTheDocument();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  it('draws the default landscape audio header at the small band with a cream equalizer', () => {
    renderCard({
      thumbFrame: 'landscape',
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    const thumb = screen.getByTestId('entity-audio-thumb');
    expect(thumb).toHaveClass(
      LANDSCAPE_THUMB_HEIGHT_CLASS.s,
      'bg-warm',
      'rounded',
      'overflow-hidden',
      'flex',
      'items-center',
      'justify-center'
    );
    expect(screen.getByTestId('entity-audio-equalizer')).toHaveClass('text-blue-600');
    expect(screen.getByRole('button', { name: 'Play audio' })).toHaveClass('group');
    expect(screen.getByTestId('entity-audio-play')).toHaveClass(
      'opacity-0',
      'group-hover:opacity-100'
    );
    expect(screen.queryByRole('button', { name: 'Play video' })).not.toBeInTheDocument();
  });

  it('keeps portrait as a 3:4 slot instead of the landscape height', () => {
    renderCard({
      thumbFrame: 'portrait',
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    expect(screen.getByTestId('entity-audio-thumb')).toHaveClass('aspect-[3/4]');
    expect(screen.getByTestId('entity-audio-thumb')).not.toHaveClass(
      LANDSCAPE_THUMB_HEIGHT_CLASS.s
    );
  });

  it('keeps video as a black play poster, not the audio equalizer', () => {
    renderCard({
      thumbFrame: 'landscape',
      thumbnailSrc: '/api/files/hearing.mp4',
      thumbnailKind: 'video',
    });
    const play = screen.getByRole('button', { name: 'Play video' });
    expect(play).toHaveClass('group', 'bg-black', LANDSCAPE_THUMB_HEIGHT_CLASS.s);
    expect(screen.getByTestId('entity-video-play')).toHaveClass(
      'rounded-full',
      'bg-white',
      'opacity-0',
      'group-hover:opacity-100'
    );
    expect(screen.queryByTestId('entity-audio-thumb')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entity-audio-equalizer')).not.toBeInTheDocument();
  });

  it('plays a video thumbnail without selecting the card', () => {
    const onSelect = jest.fn();
    renderCard({
      onSelect,
      thumbnailSrc: '/api/files/hearing.mp4',
      thumbnailKind: 'video',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('video')).toHaveAttribute('src', '/api/files/hearing.mp4');
  });
});

describe('EntityCard thumbnail size', () => {
  it('sizes the landscape band and card floor for medium', () => {
    renderCard({
      thumbFrame: 'landscape',
      thumbSize: 'm',
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    const medium = screen.getByTestId('entity-audio-thumb');
    expect(medium).toHaveClass(LANDSCAPE_THUMB_HEIGHT_CLASS.m);
    expect(medium.closest('[role="button"]')).toHaveClass(LANDSCAPE_CARD_FLOOR_CLASS.m);
  });

  it('sizes the landscape band and card floor for large', () => {
    renderCard({
      thumbFrame: 'landscape',
      thumbSize: 'l',
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    const large = screen.getByTestId('entity-audio-thumb');
    expect(large).toHaveClass(LANDSCAPE_THUMB_HEIGHT_CLASS.l);
    expect(large).not.toHaveClass('aspect-[3/4]');
    expect(large.closest('[role="button"]')).toHaveClass(LANDSCAPE_CARD_FLOOR_CLASS.l);
  });

  it('keeps portrait at 3:4 for every thumbnail size', () => {
    (['s', 'm', 'l'] as const).forEach(thumbSize => {
      const { unmount } = renderCard({
        thumbFrame: 'portrait',
        thumbSize,
        thumbnailSrc: '/api/files/hearing.mp3',
        thumbnailKind: 'audio',
      });
      const thumb = screen.getByTestId('entity-audio-thumb');
      expect(thumb).toHaveClass('aspect-[3/4]');
      expect(thumb).not.toHaveClass(LANDSCAPE_THUMB_HEIGHT_CLASS[thumbSize]);
      expect(thumb.closest('[role="button"]')).not.toHaveClass(
        LANDSCAPE_CARD_FLOOR_CLASS[thumbSize]
      );
      unmount();
    });
  });
});

describe('EntityCard audio playback', () => {
  it('defaults the thumbnail frame to portrait when none is passed', () => {
    renderCard({
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    expect(screen.getByTestId('entity-audio-thumb')).toHaveClass('aspect-[3/4]');
    expect(screen.getByTestId('entity-audio-thumb')).not.toHaveClass(
      LANDSCAPE_THUMB_HEIGHT_CLASS.s
    );
  });

  it('plays an audio thumbnail without selecting the card', () => {
    const onSelect = jest.fn();
    renderCard({
      onSelect,
      thumbnailSrc: '/api/files/hearing.mp3',
      thumbnailKind: 'audio',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('audio')).toHaveAttribute('src', '/api/files/hearing.mp3');
  });
});
