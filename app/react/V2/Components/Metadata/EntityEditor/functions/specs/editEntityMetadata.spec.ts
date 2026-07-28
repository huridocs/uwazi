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

describe('planSharedMetadataSync', () => {
  it('returns noop when shape matches exactly', () => {
    const plan = planSharedMetadataSync(baseValues({ a: [{ value: '1' }] }), [textProp('a')]);
    expect(plan).toEqual({ type: 'noop' });
  });

  it('does not noop when current metadata has extra keys from a prior template', () => {
    const plan = planSharedMetadataSync(
      baseValues({ a: [{ value: '1' }], leftover: [{ value: 'old' }] }),
      [textProp('a')]
    );

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;
    expect(plan.values.metadata).toEqual({ a: [{ value: '1' }] });
  });

  it('preserves dirty via keepDirty options on rebuild', () => {
    const plan = planSharedMetadataSync(baseValues({ a: [{ value: 'dirty' }] }), [
      textProp('a'),
      textProp('b'),
    ]);

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;

    expect(plan.options).toEqual({ keepDirty: true });
    expect(plan.values.metadata.a).toEqual([{ value: 'dirty' }]);
    expect(plan.values.metadata.b).toEqual([]);
  });

  // Shared planner: never restore bare isDirty early-return
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

  it('reshapes again on a second template switch', () => {
    const first = planSharedMetadataSync(baseValues({ simple_text: [{ value: 'doc' }] }), [
      textProp('report'),
    ]);
    expect(first.type).toBe('reset');
    if (first.type !== 'reset') return;
    expect(first.values.metadata).toEqual({ report: [] });

    const second = planSharedMetadataSync(first.values, [
      textProp('simple_text'),
      textProp('location'),
    ]);
    expect(second.type).toBe('reset');
    if (second.type !== 'reset') return;
    expect(second.values.metadata.simple_text).toEqual([]);
    expect(second.values.metadata.location).toEqual([]);
    expect(second.values.metadata).not.toHaveProperty('report');
  });

  it('force rebuilds even when shape already matches', () => {
    const values = baseValues({ a: [{ value: 'kept' }] });
    const properties = [textProp('a')];
    expect(planSharedMetadataSync(values, properties)).toEqual({ type: 'noop' });

    const forced = planSharedMetadataSync(values, properties, undefined, { force: true });
    expect(forced.type).toBe('reset');
    if (forced.type !== 'reset') return;
    expect(forced.options).toEqual({ keepDirty: true });
    expect(forced.values.metadata).toEqual({ a: [{ value: 'kept' }] });
  });

  // eslint-disable-next-line max-statements
  it('force multi-switch T1→T2→T1→T2 keeps merge overlap and final keys', () => {
    const t1 = [textProp('simple_text'), textProp('location')];
    const t2 = [textProp('report')];
    const entityMetadata = {
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
      report: [{ value: 'entity-report' }],
    };

    const toT2 = planSharedMetadataSync(
      baseValues({ simple_text: [{ value: 'dirty' }] }),
      t2,
      entityMetadata,
      { force: true }
    );
    expect(toT2.type).toBe('reset');
    if (toT2.type !== 'reset') return;
    expect(toT2.values.metadata).toEqual({ report: [{ value: 'entity-report' }] });
    expect(toT2.values.title).toBe('Title');

    const backT1 = planSharedMetadataSync(toT2.values, t1, entityMetadata, { force: true });
    expect(backT1.type).toBe('reset');
    if (backT1.type !== 'reset') return;
    expect(backT1.values.metadata).toEqual({
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
    });

    const againT2 = planSharedMetadataSync(backT1.values, t2, entityMetadata, { force: true });
    expect(againT2.type).toBe('reset');
    if (againT2.type !== 'reset') return;
    expect(Object.keys(againT2.values.metadata)).toEqual(['report']);
    expect(againT2.values.metadata.report).toEqual([{ value: 'entity-report' }]);

    const againT1 = planSharedMetadataSync(againT2.values, t1, entityMetadata, { force: true });
    expect(againT1.type).toBe('reset');
    if (againT1.type !== 'reset') return;
    expect(Object.keys(againT1.values.metadata).sort()).toEqual(['location', 'simple_text']);
  });
});
