import type { Entity } from '#V2/api/entities/types.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import { planSharedMetadataSync } from '../editEntityMetadata.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { EMPTY_ICON } from '../../Components/IconField.js';

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
  translations: {},
  touchedTranslations: {},
});

const sync = (
  currentValues: EditEntityFormValues,
  metadataProperties: FormMetadataProperty[],
  extra?: {
    entityMetadata?: Entity['metadata'];
    options?: { force?: boolean };
  }
) =>
  planSharedMetadataSync({
    currentValues,
    metadataProperties,
    entityMetadata: extra?.entityMetadata,
    options: extra?.options,
  });

describe('planSharedMetadataSync', () => {
  it('returns noop when shape matches exactly', () => {
    const plan = sync(baseValues({ a: [{ value: '1' }] }), [textProp('a')]);
    expect(plan).toEqual({ type: 'noop' });
  });

  it('does not noop when current metadata has extra keys from a prior template', () => {
    const plan = sync(baseValues({ a: [{ value: '1' }], leftover: [{ value: 'old' }] }), [
      textProp('a'),
    ]);

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;
    expect(plan.values.metadata).toEqual({ a: [{ value: '1' }] });
  });

  it('preserves dirty via keepDirty options on rebuild', () => {
    const plan = sync(baseValues({ a: [{ value: 'dirty' }] }), [textProp('a'), textProp('b')]);

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;

    expect(plan.options).toEqual({ keepDirty: true });
    expect(plan.values.metadata.a).toEqual([{ value: 'dirty' }]);
    expect(plan.values.metadata.b).toEqual([]);
  });

  it('adds missing keys for template switch without wiping existing values', () => {
    const plan = sync(
      baseValues({ title_field: [{ value: 'in-progress' }] }),
      [textProp('title_field'), textProp('report')],
      { entityMetadata: { report: [{ value: 'from-entity' }] } }
    );

    expect(plan.type).toBe('reset');
    if (plan.type !== 'reset') return;
    expect(plan.values.metadata.title_field).toEqual([{ value: 'in-progress' }]);
    expect(plan.values.metadata.report).toEqual([{ value: 'from-entity' }]);
  });

  it('reshapes again on a second template switch', () => {
    const first = sync(baseValues({ simple_text: [{ value: 'doc' }] }), [textProp('report')]);
    expect(first.type).toBe('reset');
    if (first.type !== 'reset') return;
    expect(first.values.metadata).toEqual({ report: [] });

    const second = sync(first.values, [textProp('simple_text'), textProp('location')]);
    expect(second.type).toBe('reset');
    if (second.type !== 'reset') return;
    expect(second.values.metadata.simple_text).toEqual([]);
    expect(second.values.metadata.location).toEqual([]);
    expect(second.values.metadata).not.toHaveProperty('report');
  });

  it('force rebuilds even when shape already matches', () => {
    const values = baseValues({ a: [{ value: 'kept' }] });
    const properties = [textProp('a')];
    expect(sync(values, properties)).toEqual({ type: 'noop' });

    const forced = sync(values, properties, { options: { force: true } });
    expect(forced.type).toBe('reset');
    if (forced.type !== 'reset') return;
    expect(forced.options).toEqual({ keepDirty: true });
    expect(forced.values.metadata).toEqual({ a: [{ value: 'kept' }] });
  });

  it('force T1 to T2 keeps entity report overlap', () => {
    const t2 = [textProp('report')];
    const entityMetadata = {
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
      report: [{ value: 'entity-report' }],
    };
    const toT2 = sync(baseValues({ simple_text: [{ value: 'dirty' }] }), t2, {
      entityMetadata,
      options: { force: true },
    });
    expect(toT2.type).toBe('reset');
    if (toT2.type !== 'reset') return;
    expect(toT2.values.metadata).toEqual({ report: [{ value: 'entity-report' }] });
    expect(toT2.values.title).toBe('Title');
  });

  it('force T2 to T1 restores entity overlap', () => {
    const t1 = [textProp('simple_text'), textProp('location')];
    const entityMetadata = {
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
      report: [{ value: 'entity-report' }],
    };
    const fromT2 = {
      ...baseValues({ report: [{ value: 'entity-report' }] }),
    };
    const backT1 = sync(fromT2, t1, { entityMetadata, options: { force: true } });
    expect(backT1.type).toBe('reset');
    if (backT1.type !== 'reset') return;
    expect(backT1.values.metadata).toEqual({
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
    });
  });

  it('force T1 to T2 again keeps report key', () => {
    const t2 = [textProp('report')];
    const entityMetadata = {
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
      report: [{ value: 'entity-report' }],
    };
    const fromT1 = baseValues({
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
    });
    const againT2 = sync(fromT1, t2, { entityMetadata, options: { force: true } });
    expect(againT2.type).toBe('reset');
    if (againT2.type !== 'reset') return;
    expect(Object.keys(againT2.values.metadata)).toEqual(['report']);
    expect(againT2.values.metadata.report).toEqual([{ value: 'entity-report' }]);
  });

  it('force T2 to T1 again keeps template keys', () => {
    const t1 = [textProp('simple_text'), textProp('location')];
    const entityMetadata = {
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
      report: [{ value: 'entity-report' }],
    };
    const fromT2 = baseValues({ report: [{ value: 'entity-report' }] });
    const againT1 = sync(fromT2, t1, { entityMetadata, options: { force: true } });
    expect(againT1.type).toBe('reset');
    if (againT1.type !== 'reset') return;
    expect(Object.keys(againT1.values.metadata).sort()).toEqual(['location', 'simple_text']);
  });
});
