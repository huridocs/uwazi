import type { Entity } from '#V2/api/entities/types.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import {
  buildEditEntitySaveInput,
  formatMetadataForEntity,
  mergeSharedFormMetadata,
  planSharedMetadataSync,
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
  };

  it('should format metadata and clear icon when showIcon is false', () => {
    expect(
      buildEditEntitySaveInput({
        entity,
        values,
        metadataProperties: properties,
        pendingAttachments: [],
        mediaPropertyNames: new Set(),
      })
    ).toMatchObject({
      title: 'Updated',
      icon: { _id: null, type: 'Empty', label: '' },
      metadata: { simple_text: [{ value: 'hello' }] },
      attachments: [{ _id: 'a1', filename: 'existing.pdf' }],
    });
  });
});

const textProp = (name: string, id = name): FormMetadataProperty => ({
  _id: id,
  type: 'text',
  name,
  label: name,
});

const baseValues = (metadata: EditEntityFormValues['metadata']): EditEntityFormValues => ({
  title: 'Title',
  template: 't1',
  showIcon: false,
  icon: EMPTY_ICON,
  metadata,
});

describe('mergeSharedFormMetadata', () => {
  it('returns undefined on same-shape no-op', () => {
    const properties = [textProp('a'), textProp('b')];
    const current = { a: [{ value: '1' }], b: [{ value: '2' }] };

    expect(mergeSharedFormMetadata(current, properties)).toBeUndefined();
  });

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
});

describe('planSharedMetadataSync', () => {
  it('returns noop when shape matches', () => {
    const plan = planSharedMetadataSync(baseValues({ a: [{ value: '1' }] }), [textProp('a')]);
    expect(plan).toEqual({ type: 'noop' });
  });

  it('preserves dirty via keepDirty options on rebuild', () => {
    const plan = planSharedMetadataSync(baseValues({ a: [{ value: 'dirty' }] }), [
      textProp('a'),
      textProp('b'),
    ]);

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;

    expect(plan.options).toEqual({ keepDirty: true, keepDirtyValues: true });
    expect(plan.values.metadata.a).toEqual([{ value: 'dirty' }]);
    expect(plan.values.metadata.b).toEqual([]);
  });

  // Own-form and shared both use this planner: never restore bare isDirty early-return
  // (blocks template-switch reshape / EditEntity.cy looking for new fields).
  it('adds missing keys for template switch without wiping existing values', () => {
    const plan = planSharedMetadataSync(
      baseValues({ title_field: [{ value: 'in-progress' }] }),
      [textProp('title_field'), textProp('report')],
      { report: [{ value: 'from-entity' }] }
    );

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;
    expect(plan.values.metadata.title_field).toEqual([{ value: 'in-progress' }]);
    expect(plan.values.metadata.report).toEqual([{ value: 'from-entity' }]);
  });
});
