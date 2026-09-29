import type { Entity } from '#V2/api/entities/types.js';
import type { ClientFile } from '#app/istore.js';
import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import { buildEditEntitySaveInput, formatMetadataForEntity } from '../editEntityMetadata.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { EMPTY_ICON } from '../../Components/IconField.js';

describe('formatMetadataForEntity', () => {
  const rel = (id: string, name: string, label: string): FormMetadataProperty => ({
    _id: id,
    type: 'relationship',
    name,
    label,
    content: 'template2',
    relationType: 'rel1',
  });
  const properties: FormMetadataProperty[] = [
    { _id: '1', type: 'text', name: 'simple_text', label: 'Text' },
    rel('2', 'related_people', 'Owner'),
    rel('3', 'related_residents', 'Residents'),
    { _id: '4', type: 'geolocation', name: 'location', label: 'Location' },
  ];

  it('should sync grouped relationship values before mapping to entity metadata', () => {
    const result = formatMetadataForEntity(
      {
        simple_text: [{ value: 'hello' }],
        related_people: [{ value: 'shared-1', label: 'One' }],
        related_residents: [{ value: 'stale' }],
        location: [{ value: { lat: 1, lon: 2 } }],
      },
      properties
    );

    expect(result?.related_people).toEqual([{ value: 'shared-1', label: 'One' }]);
    expect(result?.related_residents).toEqual([{ value: 'shared-1', label: 'One' }]);
    expect(result?.simple_text).toEqual([{ value: 'hello' }]);
  });

  it('should drop null geolocation values', () => {
    const result = formatMetadataForEntity(
      {
        simple_text: [],
        related_people: [],
        related_residents: [],
        location: [{ value: null }, { value: { lat: 10, lon: 20 } }],
      },
      properties
    );

    expect(result?.location).toEqual([{ value: { lat: 10, lon: 20 } }]);
  });
});

describe('buildEditEntitySaveInput', () => {
  const entity: Entity = {
    _id: 'e1',
    language: 'en',
    mongoLanguage: 'en',
    sharedId: 'shared-1',
    title: 'Original',
    user: 'user',
    template: 'tpl-1',
    creationDate: 1,
    attachments: [{ _id: 'a1', filename: 'existing.pdf' }],
  };

  const properties: FormMetadataProperty[] = [
    { _id: '1', type: 'text', name: 'simple_text', label: 'Text' },
  ];

  const values: EditEntityFormValues = {
    title: 'Updated',
    template: 'tpl-1',
    showIcon: false,
    icon: { _id: 'icon-1', type: 'Icons', label: 'Icon' },
    metadata: { simple_text: [{ value: 'hello' }] },
    translations: {},
    touchedTranslations: {},
  };

  it('should format metadata and clear icon when showIcon is false', () => {
    const saved = buildEditEntitySaveInput({
      entity,
      values,
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
    });
    expect(saved).toMatchObject({
      title: 'Updated',
      metadata: { simple_text: [{ value: 'hello' }] },
      attachments: [{ _id: 'a1', filename: 'existing.pdf' }],
    });
    expect(saved.icon).toEqual(EMPTY_ICON);
  });

  it('should clear icon when showIcon is true but icon is empty', () => {
    const saved = buildEditEntitySaveInput({
      entity,
      values: { ...values, showIcon: true, icon: EMPTY_ICON },
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
    });
    expect(saved.icon).toEqual(EMPTY_ICON);
  });

  it('should keep icon when showIcon is true and icon is set', () => {
    const icon = { _id: 'icon-1', type: 'Icons', label: 'Icon' };
    const saved = buildEditEntitySaveInput({
      entity,
      values: { ...values, showIcon: true, icon },
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
    });
    expect(saved.icon).toEqual(icon);
  });

  it('should add propertySelections when mainDocument id and draft selections exist', () => {
    const draft = [
      {
        name: 'simple_text',
        propertyID: '1',
        selection: {
          text: 'from pdf',
          selectionRectangles: [{ top: 1, left: 1, width: 2, height: 2, page: '1' }],
        },
      },
    ];
    const saved = buildEditEntitySaveInput({
      entity,
      values,
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
      mainDocumentId: 'file-1',
      draftPropertySelections: draft,
    });
    expect(saved.propertySelections).toEqual({
      fileID: 'file-1',
      selections: draft,
    });
  });

  it('should include deleteSelection drafts in propertySelections payload', () => {
    const draft = [
      {
        name: 'simple_text',
        propertyID: '1',
        selection: { text: '', selectionRectangles: [] },
        deleteSelection: true,
      },
    ];
    const saved = buildEditEntitySaveInput({
      entity,
      values,
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
      mainDocumentId: 'file-1',
      draftPropertySelections: draft,
    });
    expect(saved.propertySelections).toEqual({
      fileID: 'file-1',
      selections: draft,
    });
  });

  it('should omit propertySelections without a main document id', () => {
    const saved = buildEditEntitySaveInput({
      entity,
      values,
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      currentLanguage: entity.language,
      draftPropertySelections: [{ name: 'simple_text', selection: { text: 'x' } }],
    });
    expect(saved.propertySelections).toBeUndefined();
  });

  describe('translations', () => {
    const langs: LanguagesListSchema = [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ];
    it('omits the UI language from translations even when it differs from entity.language', () => {
      const saved = buildEditEntitySaveInput({
        entity,
        currentLanguage: 'es',
        values: {
          ...values,
          title: 'Audiencia',
          metadata: { simple_text: [{ value: 'hola' }] },
          translations: {
            en: { title: [{ value: 'Updated' }], simple_text: [{ value: 'hello' }] },
          },
        },
        metadataProperties: properties,
        pendingAttachments: [],
        mediaPropertyNames: new Set(),
        languages: langs,
      });
      expect(saved.language).toBe('es');
      expect(saved.translations).toEqual({
        en: { title: [{ value: 'Updated' }], simple_text: [{ value: 'hello' }] },
      });
    });

    const pending: ClientFile = {
      _id: 'esPhoto',
      fileLocalID: 'esPhoto',
      originalname: 'es.png',
      filename: 'es.png',
      type: 'attachment',
    };
    const photoProps: FormMetadataProperty[] = [
      { _id: 'p', type: 'image', name: 'photo', label: 'Photo' },
    ];

    it('keeps pending uploads referenced only by another language', () => {
      const saved = buildEditEntitySaveInput({
        entity,
        currentLanguage: 'en',
        values: {
          ...values,
          metadata: { photo: [{ value: '/en.jpg' }] },
          translations: { es: { title: [{ value: 'Audiencia' }], photo: [{ value: 'esPhoto' }] } },
        },
        metadataProperties: photoProps,
        pendingAttachments: [pending],
        mediaPropertyNames: new Set(['photo']),
        languages: langs,
      });
      expect(saved.attachments).toEqual([{ _id: 'a1', filename: 'existing.pdf' }, pending]);
    });

    it('creates without persisted ids and keeps pending media referenced only in translations', () => {
      const saved = buildEditEntitySaveInput({
        currentLanguage: 'en',
        values: {
          ...values,
          title: 'New',
          metadata: { photo: [{ value: '/en.jpg' }] },
          translations: { es: { title: [{ value: 'Nuevo' }], photo: [{ value: 'esPhoto' }] } },
        },
        metadataProperties: photoProps,
        pendingAttachments: [pending],
        mediaPropertyNames: new Set(['photo']),
        languages: langs,
      });
      expect(saved._id).toBeUndefined();
      expect(saved.sharedId).toBeUndefined();
      expect(saved.language).toBe('en');
      expect(saved.attachments).toEqual([pending]);
      expect(saved.translations).toEqual({
        es: { title: [{ value: 'Nuevo' }], photo: [{ value: 'esPhoto' }] },
      });
    });
  });
});
