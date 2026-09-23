import type { Template } from '#app/apiResponseTypes.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import { metadataFieldsForCard, thumbnailFromEntity } from '../cardModel.js';

const context = { ...metadataDisplayPresets.compact, locale: 'en' };

const documentFile = (id: string, language = 'eng'): FileType => ({
  _id: id,
  filename: `${id}.pdf`,
  originalname: `${id}.pdf`,
  mimetype: 'application/pdf',
  type: 'document',
  language,
});

const entity = (overrides: Partial<Entity> = {}): Entity => ({
  _id: 'e1',
  sharedId: 's1',
  title: 'Hearing',
  template: 'tmpl1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  ...overrides,
});

const template = (properties: Template['properties']): Template =>
  ({
    _id: 'tmpl1',
    name: 'Hearing',
    properties,
  }) as Template;

describe('thumbnailFromEntity', () => {
  it('uses the first showInCard preview or image property as the thumbnail', () => {
    const hearing = entity({
      preview: 'doc-preview.jpg',
      metadata: {
        cover: [{ value: '/api/files/cover.png' }],
        preview: [{ value: '/api/files/custom-preview.png' }],
      },
      documents: [documentFile('doc-1')],
    });
    const tmpl = template([
      { _id: 'p-text', name: 'summary', label: 'Summary', type: 'text', showInCard: true },
      { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image', showInCard: true },
      { _id: 'p-preview', name: 'preview', label: 'Preview', type: 'preview', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/cover.png',
      propertyName: 'cover',
      kind: 'image',
      fit: 'cover',
    });
  });

  it('uses entity.preview when a showInCard preview has no metadata', () => {
    const hearing = entity({ preview: 'doc-preview.jpg' });
    const tmpl = template([
      { _id: 'p-preview', name: 'preview', label: 'Preview', type: 'preview', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/doc-preview.jpg',
      propertyName: 'preview',
      kind: 'document',
      fit: 'cover',
    });
  });

  it('skips an empty showInCard image and uses the next showInCard visual that has a value', () => {
    const hearing = entity({
      preview: 'doc-preview.jpg',
      metadata: { recording: [{ value: '/api/files/hearing.mp3' }] },
      documents: [documentFile('doc-1')],
    });
    const tmpl = template([
      { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image', showInCard: true },
      { _id: 'p-media', name: 'recording', label: 'Recording', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/hearing.mp3',
      propertyName: 'recording',
      kind: 'audio',
      fit: 'cover',
    });
  });

  it('skips empty showInCard visuals and uses the document thumbnail', () => {
    const hearing = entity({
      preview: 'doc-preview.jpg',
      documents: [documentFile('doc-1')],
    });
    const tmpl = template([
      { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image', showInCard: true },
      { _id: 'p-media', name: 'recording', label: 'Recording', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/doc-preview.jpg',
      kind: 'document',
      fit: 'cover',
    });
  });

  it('uses a showInCard video media field as the thumbnail', () => {
    const hearing = entity({
      metadata: { clip: [{ value: '/api/files/hearing.mp4' }] },
      documents: [documentFile('doc-1')],
    });
    const tmpl = template([
      { _id: 'p-media', name: 'clip', label: 'Clip', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/hearing.mp4',
      propertyName: 'clip',
      kind: 'video',
      fit: 'cover',
    });
  });

  it('unwraps media timelinks payloads when choosing a thumbnail', () => {
    const hearing = entity({
      metadata: {
        clip: [
          {
            value: '(/api/files/hearing.mp4, {"timelinks":{"00:00:00":""}})',
          },
        ],
      },
    });
    const tmpl = template([
      { _id: 'p-media', name: 'clip', label: 'Clip', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/hearing.mp4',
      propertyName: 'clip',
      kind: 'video',
      fit: 'cover',
    });
  });

  it('uses the document thumbnail when no preview or image is marked showInCard', () => {
    const hearing = entity({
      preview: 'doc-preview.jpg',
      metadata: { cover: [{ value: '/api/files/cover.png' }] },
      documents: [documentFile('doc-1')],
    });
    const tmpl = template([
      { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image' },
      { _id: 'p-preview', name: 'preview', label: 'Preview', type: 'preview' },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/doc-preview.jpg',
      kind: 'document',
      fit: 'cover',
    });
  });

  it('falls back to the main document jpg when entity.preview is missing', () => {
    const hearing = entity({ documents: [documentFile('doc-1')] });
    const tmpl = template([]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/doc-1.jpg',
      kind: 'document',
      fit: 'cover',
    });
  });

  it('uses the placeholder when showInCard visuals are empty and there is no document', () => {
    const hearing = entity({
      metadata: { cover: [{ value: '/api/files/cover.png' }] },
    });
    const tmpl = template([
      { _id: 'p-empty', name: 'photo', label: 'Photo', type: 'image', showInCard: true },
      { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image' },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({});
  });

  it('returns no src when nothing can be shown', () => {
    expect(thumbnailFromEntity(entity(), template([]))).toEqual({});
  });
});

describe('thumbnail fit from template', () => {
  it('uses the template image property style for object-fit', () => {
    const hearing = entity({
      metadata: { cover: [{ value: '/api/files/cover.png' }] },
    });
    const tmpl = template([
      {
        _id: 'p-cover',
        name: 'cover',
        label: 'Cover',
        type: 'image',
        showInCard: true,
        style: 'contain',
      },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl).fit).toBe('contain');
  });
});

describe('thumbnail kind for image files', () => {
  it('treats a showInCard image property as an image even when the file is a png', () => {
    const hearing = entity({
      metadata: { cover: [{ value: '17900782341876n5ao2986x.png' }] },
    });
    const tmpl = template([
      { _id: 'p-cover', name: 'cover', label: 'Image', type: 'image', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/17900782341876n5ao2986x.png',
      propertyName: 'cover',
      kind: 'image',
      fit: 'cover',
    });
  });

  it('classifies a media field that points at a png as an image, not a video', () => {
    const hearing = entity({
      metadata: { cover: [{ value: '/api/files/17900782341876n5ao2986x.png' }] },
    });
    const tmpl = template([
      { _id: 'p-media', name: 'cover', label: 'Image', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/17900782341876n5ao2986x.png',
      propertyName: 'cover',
      kind: 'image',
      fit: 'cover',
    });
  });
});

describe('metadataFieldsForCard', () => {
  const tmpl = template([
    { _id: 'p-cover', name: 'cover', label: 'Cover', type: 'image', showInCard: true },
    { _id: 'p-media', name: 'recording', label: 'Recording', type: 'media', showInCard: true },
    { _id: 'p-country', name: 'country', label: 'Country', type: 'select', showInCard: true },
    { _id: 'p-year', name: 'year', label: 'Year', type: 'numeric', showInCard: true },
    { _id: 'p-hidden', name: 'notes', label: 'Notes', type: 'text' },
    { _id: 'p-extra', name: 'session', label: 'Session', type: 'text', showInCard: true },
  ]);

  const hearing = entity({
    metadata: {
      cover: [{ value: '/api/files/cover.png' }],
      recording: [{ value: '/api/files/hearing.mp4', alt: 'hearing.mp4' }],
      country: [{ value: 'ar', label: 'Argentina' }],
      year: [{ value: 2021 }],
      notes: [{ value: 'internal' }],
      session: [{ value: '141' }],
    },
  });

  it('lists showInCard fields, skips the thumbnail property, and caps at three', () => {
    expect(metadataFieldsForCard(hearing, tmpl, { excludeProperty: 'cover', context })).toEqual([
      { id: 'recording', label: 'Recording', value: 'hearing.mp4', interactive: true },
      { id: 'country', label: 'Country', value: 'Argentina', interactive: false },
      { id: 'year', label: 'Year', value: '2021', interactive: false },
    ]);
  });

  it('renders the thumbnail visual as a filename row when it is not excluded', () => {
    expect(metadataFieldsForCard(hearing, tmpl, { context })[0]).toEqual({
      id: 'cover',
      label: 'Cover',
      value: 'cover.png',
      interactive: true,
    });
  });

  it('does not include properties that are not marked showInCard', () => {
    const fields = metadataFieldsForCard(hearing, tmpl, { excludeProperty: 'cover', context });
    expect(fields.map(field => field.id)).not.toContain('notes');
  });

  it('renders a showInCard preview from entity.preview as a filename row', () => {
    const previewTmpl = template([
      { _id: 'p-preview', name: 'preview', label: 'Document', type: 'preview', showInCard: true },
    ]);
    const withPreview = entity({ preview: 'doc-preview.jpg' });
    expect(metadataFieldsForCard(withPreview, previewTmpl, { context })).toEqual([
      { id: 'preview', label: 'Document', value: 'doc-preview.jpg', interactive: true },
    ]);
  });
});
