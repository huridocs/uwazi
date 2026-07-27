import { mergeSharedFormMetadata, planSharedMetadataSync } from '../mergeSharedFormMetadata.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
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
});
