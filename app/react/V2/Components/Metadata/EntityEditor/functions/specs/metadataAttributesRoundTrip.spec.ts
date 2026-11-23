import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { prepareEntityForSave } from '#shared/entitySave/prepareEntityForSave.js';
import type { EntityWithSaveMetadata } from '#shared/entitySave/types.js';
import { mediaContextFromProperties } from '#shared/entitySave/mediaContext.js';
import { EMPTY_ICON } from '../../Components/IconField.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import { buildEditEntitySaveInput } from '../editEntityMetadata.js';
import { formatMetadataForForm, type FormMetadataProperty } from '../formatMetadataForForm.js';

const marks = ['ai_generated', 'sync_off'];
const property = (name: string, type: FormMetadataProperty['type']): FormMetadataProperty => ({
  _id: name,
  type,
  name,
  label: name,
});
const properties: FormMetadataProperty[] = [
  property('text', 'text'),
  property('markdown', 'markdown'),
  property('numeric', 'numeric'),
  property('date', 'date'),
  property('multidate', 'multidate'),
  property('daterange', 'daterange'),
  property('multidaterange', 'multidaterange'),
  property('generatedid', 'generatedid'),
  property('geolocation', 'geolocation'),
  property('link', 'link'),
  property('select', 'select'),
  property('multiselect', 'multiselect'),
  property('relationship', 'relationship'),
  property('image', 'image'),
  property('media', 'media'),
  property('preview', 'preview'),
  property('nested', 'nested'),
];
const storedMetadata = {
  text: [{ value: 'hello', attributes: marks }],
  markdown: [{ value: '**a**', attributes: marks }],
  numeric: [{ value: 1, attributes: marks }],
  date: [{ value: 10, attributes: marks }],
  multidate: [{ value: 10, attributes: marks }, { value: 20 }],
  daterange: [{ value: { from: 1, to: 2 }, attributes: marks }],
  multidaterange: [{ value: { from: 3, to: 4 }, attributes: [] }],
  generatedid: [{ value: 'GEN-1', attributes: marks }],
  geolocation: [{ value: { lat: 1, lon: 2, label: '' }, attributes: marks }],
  link: [{ value: { label: 'Docs', url: 'https://example.com' }, attributes: marks }],
  select: [{ value: 'a', label: 'A', attributes: marks }],
  multiselect: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B', attributes: [] },
  ],
  relationship: [{ value: 'e1', label: 'Ana', type: 'entity', attributes: marks }],
  image: [{ value: '/api/files/photo.jpg', attributes: marks }],
  media: [{ value: 'https://cdn.example/clip.mp4', attributes: marks }],
  preview: [{ value: '/api/files/preview.jpg', attributes: marks }],
  nested: [{ value: { child: ['x'] }, attributes: marks }],
};
const stripAttributes = (entries: MetadataValue[]): MetadataValue[] =>
  entries.map(({ attributes: _attributes, ...entry }) => entry);

const editedFormMetadata = () => {
  const loaded = formatMetadataForForm(properties, storedMetadata as Entity['metadata']);
  loaded.text = [{ ...loaded.text[0], value: 'edited' }];
  loaded.image = [{ ...loaded.image[0], value: '/api/files/other.jpg' }];
  return loaded;
};

const strippedFormMetadata = () =>
  Object.fromEntries(
    Object.entries(editedFormMetadata()).map(([name, entries]) => [name, stripAttributes(entries)])
  );

const entity = {
  _id: 'e1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared-1',
  title: 'Original',
  user: 'user',
  template: 'tpl-1',
  creationDate: 1,
  metadata: storedMetadata,
  translations: {
    es: {
      image: [{ value: '/api/files/es.jpg', attributes: marks }],
      text: [{ value: 'hola', attributes: [] }],
    },
  },
} as Entity;

const save = (metadata: EditEntityFormValues['metadata']) => {
  const values: EditEntityFormValues = {
    title: 'Original',
    template: 'tpl-1',
    showIcon: false,
    icon: EMPTY_ICON,
    metadata,
    translations: {
      es: {
        title: [{ value: 'Titulo' }],
        image: [{ value: '/api/files/es.jpg' }],
        text: [{ value: 'hola' }],
      },
    },
    touchedTranslations: { es: { image: true, text: true } },
  };
  const saved = buildEditEntitySaveInput({
    entity,
    values,
    metadataProperties: properties,
    pendingAttachments: [],
    mediaPropertyNames: new Set(['image', 'media']),
    currentLanguage: 'en',
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
  });
  return prepareEntityForSave(
    {
      metadata: saved.metadata,
      translations: saved.translations,
      attachments: [],
    } as EntityWithSaveMetadata,
    mediaContextFromProperties([
      { name: 'image', type: 'image' },
      { name: 'media', type: 'media' },
    ])
  );
};

describe('metadata attributes round trip', () => {
  it('keeps attributes the form still holds, including a changed image', () => {
    const saved = save(editedFormMetadata());
    expect(saved.metadata).toEqual({
      text: [{ value: 'edited', attributes: marks }],
      markdown: [{ value: '**a**', attributes: marks }],
      numeric: [{ value: 1, attributes: marks }],
      date: [{ value: 10, attributes: marks }],
      multidate: [{ value: 10, attributes: marks }, { value: 20 }],
      daterange: [{ value: { from: 1, to: 2 }, attributes: marks }],
      multidaterange: [{ value: { from: 3, to: 4 }, attributes: [] }],
      generatedid: [{ value: 'GEN-1', attributes: marks }],
      geolocation: [{ value: { lat: 1, lon: 2, label: '' }, attributes: marks }],
      link: [{ value: { label: 'Docs', url: 'https://example.com' }, attributes: marks }],
      select: [{ value: 'a', label: 'A', attributes: marks }],
      multiselect: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', attributes: [] },
      ],
      relationship: [{ value: 'e1', attributes: marks }],
      image: [{ value: '/api/files/other.jpg', attributes: marks }],
      media: [{ value: 'https://cdn.example/clip.mp4', attributes: marks }],
      preview: [{ value: '/api/files/preview.jpg', attributes: marks }],
      nested: [{ value: { child: ['x'] }, attributes: marks }],
    });
    expect(saved.translations?.es.image).toEqual([{ value: '/api/files/es.jpg' }]);
    expect(saved.translations?.es.text).toEqual([{ value: 'hola' }]);
  });

  it('does not copy attributes back from the loaded entity after the form drops them', () => {
    const saved = save(strippedFormMetadata());
    expect(saved.metadata?.text).toEqual([{ value: 'edited' }]);
    expect(saved.metadata?.image).toEqual([{ value: '/api/files/other.jpg' }]);
    expect(saved.metadata?.select).toEqual([{ value: 'a', label: 'A' }]);
    expect(saved.translations?.es.image).toEqual([{ value: '/api/files/es.jpg' }]);
    expect(saved.translations?.es.text).toEqual([{ value: 'hola' }]);
  });
});
