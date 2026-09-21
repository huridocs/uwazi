import type { Entity } from '#V2/api/entities/types.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import {
  buildEditEntitySaveInput,
  formatMetadataForEntity,
  isEntityEditorDirty,
  mergeSharedFormMetadata,
} from '../editEntityMetadata.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { EMPTY_ICON } from '../../Components/IconField.js';

describe('formatMetadataForEntity', () => {
  const properties: FormMetadataProperty[] = [
    { _id: '1', type: 'text', name: 'simple_text', label: 'Text' },
    {
      _id: '2',
      type: 'relationship',
      name: 'related_people',
      label: 'Owner',
      content: 'template2',
      relationType: 'rel1',
    },
    {
      _id: '3',
      type: 'relationship',
      name: 'related_residents',
      label: 'Residents',
      content: 'template2',
      relationType: 'rel1',
    },
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
      draftPropertySelections: [{ name: 'simple_text', selection: { text: 'x' } }],
    });
    expect(saved.propertySelections).toBeUndefined();
  });

  it('includes complete translations for other installed languages', () => {
    const saved = buildEditEntitySaveInput({
      entity,
      values: {
        ...values,
        translations: {
          es: {
            title: [{ value: 'Actualizado' }],
            simple_text: [{ value: 'hola' }],
          },
        },
      },
      metadataProperties: properties,
      pendingAttachments: [],
      mediaPropertyNames: new Set(),
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'fr', label: 'French', installing: true },
      ],
    });
    expect(saved.translations).toEqual({
      es: {
        title: [{ value: 'Actualizado' }],
        simple_text: [{ value: 'hola' }],
      },
    });
  });
});

describe('isEntityEditorDirty', () => {
  it('is dirty when only draft property selections exist (e.g. Clear PDF)', () => {
    expect(isEntityEditorDirty(false, 1)).toBe(true);
  });

  it('is dirty when the form is dirty without drafts', () => {
    expect(isEntityEditorDirty(true, 0)).toBe(true);
  });

  it('is clean when form and drafts are empty', () => {
    expect(isEntityEditorDirty(false, 0)).toBe(false);
  });
});

const textProp = (name: string, id = name): FormMetadataProperty => ({
  _id: id,
  type: 'text',
  name,
  label: name,
});

describe('mergeSharedFormMetadata', () => {
  it('rebuilds shape while keeping existing dirty field values', () => {
    const properties = [textProp('a'), textProp('b'), textProp('c')];
    const current = { a: [{ value: 'dirty-a' }] };
    const entityMetadata = {
      a: [{ value: 'entity-a' }],
      b: [{ value: 'entity-b' }],
      c: [{ value: 'entity-c' }],
    };

    expect(mergeSharedFormMetadata(current, properties, entityMetadata)).toEqual({
      a: [{ value: 'dirty-a' }],
      b: [{ value: 'entity-b' }],
      c: [{ value: 'entity-c' }],
    });
  });

  it('strips keys that are not on the target template', () => {
    expect(
      mergeSharedFormMetadata({ report: [{ value: 'x' }], leftover: [{ value: 'y' }] }, [
        textProp('report'),
      ])
    ).toEqual({ report: [{ value: 'x' }] });
  });
});
