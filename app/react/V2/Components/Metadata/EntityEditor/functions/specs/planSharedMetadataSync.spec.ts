import type { Entity } from '#V2/api/entities/types.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import {
  isEntityEditorDirty,
  mergeSharedFormMetadata,
  planSharedMetadataSync,
} from '../editEntityMetadata.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { EMPTY_ICON } from '../../Components/IconField.js';

const mockGenerateID = jest.fn(
  (_characterLength: number, _numericLength: number, _extraLength: number) => 'GEN-ID'
);

jest.mock('#shared/IDGenerator', () => ({
  generateID: (characterLength: number, numericLength: number, extraLength: number) =>
    mockGenerateID(characterLength, numericLength, extraLength),
}));

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
    commonProperties?: { name: string; generatedId?: boolean }[];
  }
) =>
  planSharedMetadataSync({
    currentValues,
    metadataProperties,
    entityMetadata: extra?.entityMetadata,
    commonProperties: extra?.commonProperties,
    options: extra?.options,
  });

const generatedTitle = [{ name: 'title', generatedId: true }];

const forcedTitle = (title: string, commonProperties: { name: string; generatedId?: boolean }[]) =>
  sync({ ...baseValues({}), title }, [], { options: { force: true }, commonProperties });

const whenReset = (plan: ReturnType<typeof sync>) => {
  expect(plan.type).toBe('reset');
  if (plan.type !== 'reset') throw new Error(plan.type);
  return plan;
};

const resetTitle = (plan: ReturnType<typeof sync>) => whenReset(plan).values.title;

const overlap = {
  simple_text: [{ value: 'from-entity' }],
  location: [{ value: 'loc' }],
  report: [{ value: 'entity-report' }],
};

describe('generated id title', () => {
  beforeEach(() => {
    mockGenerateID.mockClear();
  });

  it('fills an empty title when switching onto a generated id template', () => {
    expect(resetTitle(forcedTitle('', generatedTitle))).toBe('GEN-ID');
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
  });

  it('keeps a title that is already set', () => {
    expect(resetTitle(forcedTitle('User text', generatedTitle))).toBe('User text');
    expect(resetTitle(forcedTitle('PREV-1', generatedTitle))).toBe('PREV-1');
    expect(mockGenerateID).not.toHaveBeenCalled();
  });

  it('leaves an empty title empty on a non-generated template', () => {
    expect(resetTitle(forcedTitle('', [{ name: 'title' }]))).toBe('');
    expect(resetTitle(forcedTitle('', []))).toBe('');
    expect(mockGenerateID).not.toHaveBeenCalled();
  });

  it('fills an empty title when the same template gains generatedId', () => {
    const plan = sync({ ...baseValues({ a: [{ value: '1' }] }), title: '' }, [textProp('a')], {
      commonProperties: generatedTitle,
    });
    expect(resetTitle(plan)).toBe('GEN-ID');
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
  });
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

    expect(whenReset(plan).values.metadata).toEqual({ a: [{ value: '1' }] });
  });

  it('preserves dirty via keepDirty options on rebuild', () => {
    const plan = sync(baseValues({ a: [{ value: 'dirty' }] }), [textProp('a'), textProp('b')]);

    const reset = whenReset(plan);
    expect(reset.options).toEqual({ keepDirty: true });
    expect(reset.values.metadata.a).toEqual([{ value: 'dirty' }]);
    expect(reset.values.metadata.b).toEqual([]);
  });

  it('adds missing keys for template switch without wiping existing values', () => {
    const plan = sync(
      baseValues({ title_field: [{ value: 'in-progress' }] }),
      [textProp('title_field'), textProp('report')],
      { entityMetadata: { report: [{ value: 'from-entity' }] } }
    );

    const reset = whenReset(plan);
    expect(reset.values.metadata.title_field).toEqual([{ value: 'in-progress' }]);
    expect(reset.values.metadata.report).toEqual([{ value: 'from-entity' }]);
  });

  it('reshapes again on a second template switch', () => {
    const first = whenReset(
      sync(baseValues({ simple_text: [{ value: 'doc' }] }), [textProp('report')])
    );
    expect(first.values.metadata).toEqual({ report: [] });

    const second = whenReset(sync(first.values, [textProp('simple_text'), textProp('location')]));
    expect(second.values.metadata.simple_text).toEqual([]);
    expect(second.values.metadata.location).toEqual([]);
    expect(second.values.metadata).not.toHaveProperty('report');
  });

  it('force rebuilds even when shape already matches', () => {
    const values = baseValues({ a: [{ value: 'kept' }] });
    const properties = [textProp('a')];
    expect(sync(values, properties)).toEqual({ type: 'noop' });

    const forced = whenReset(sync(values, properties, { options: { force: true } }));
    expect(forced.options).toEqual({ keepDirty: true });
    expect(forced.values.metadata).toEqual({ a: [{ value: 'kept' }] });
  });

  it('force T1 to T2 keeps entity report overlap', () => {
    const toT2 = whenReset(
      sync(baseValues({ simple_text: [{ value: 'dirty' }] }), [textProp('report')], {
        entityMetadata: overlap,
        options: { force: true },
      })
    );
    expect(toT2.values.metadata).toEqual({ report: [{ value: 'entity-report' }] });
    expect(toT2.values.title).toBe('Title');
  });

  it('force T2 to T1 restores entity overlap', () => {
    const backT1 = whenReset(
      sync(
        baseValues({ report: [{ value: 'entity-report' }] }),
        [textProp('simple_text'), textProp('location')],
        {
          entityMetadata: overlap,
          options: { force: true },
        }
      )
    );
    expect(backT1.values.metadata).toEqual({
      simple_text: [{ value: 'from-entity' }],
      location: [{ value: 'loc' }],
    });
  });

  it('force T1 to T2 again keeps report key', () => {
    const againT2 = whenReset(
      sync(
        baseValues({ simple_text: [{ value: 'from-entity' }], location: [{ value: 'loc' }] }),
        [textProp('report')],
        { entityMetadata: overlap, options: { force: true } }
      )
    );
    expect(Object.keys(againT2.values.metadata)).toEqual(['report']);
    expect(againT2.values.metadata.report).toEqual([{ value: 'entity-report' }]);
  });

  it('force T2 to T1 again keeps template keys', () => {
    const againT1 = whenReset(
      sync(
        baseValues({ report: [{ value: 'entity-report' }] }),
        [textProp('simple_text'), textProp('location')],
        {
          entityMetadata: overlap,
          options: { force: true },
        }
      )
    );
    expect(Object.keys(againT1.values.metadata).sort()).toEqual(['location', 'simple_text']);
  });
});

describe('isEntityEditorDirty', () => {
  it('tracks form dirtiness and draft selections', () => {
    expect(isEntityEditorDirty(false, 1)).toBe(true);
    expect(isEntityEditorDirty(true, 0)).toBe(true);
    expect(isEntityEditorDirty(false, 0)).toBe(false);
  });
});

const generatedIdProp = (): FormMetadataProperty => ({
  _id: 'generatedid',
  type: 'generatedid',
  name: 'generatedid',
  label: 'Generatedid',
});

const forcedGeneratedId = (metadata: EditEntityFormValues['metadata']) =>
  sync(baseValues(metadata), [generatedIdProp()], { options: { force: true } });

describe('generated id property', () => {
  beforeEach(() => {
    mockGenerateID.mockClear();
  });

  it('fills an empty generated id on a forced template switch', () => {
    expect(whenReset(forcedGeneratedId({})).values.metadata.generatedid).toEqual([
      { value: 'GEN-ID' },
    ]);
    expect(mockGenerateID).toHaveBeenCalledTimes(1);
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
  });

  it('keeps a stored generated id without calling generateID', () => {
    const stored = whenReset(forcedGeneratedId({ generatedid: [{ value: 'YDZ2036-9005' }] }));
    expect(stored.values.metadata.generatedid).toEqual([{ value: 'YDZ2036-9005' }]);
    expect(mockGenerateID).not.toHaveBeenCalled();
  });

  it('fills an empty generated id when the metadata shape already matches', () => {
    const plan = whenReset(sync(baseValues({ generatedid: [] }), [generatedIdProp()]));
    expect(plan.values.metadata.generatedid).toEqual([{ value: 'GEN-ID' }]);
    expect(mockGenerateID).toHaveBeenCalledWith(3, 4, 4);
  });

  it('stays noop when a matching generated id is already stored', () => {
    const plan = sync(baseValues({ generatedid: [{ value: 'YDZ2036-9005' }] }), [
      generatedIdProp(),
    ]);
    expect(plan.type).toBe('noop');
    expect(mockGenerateID).not.toHaveBeenCalled();
  });

  it('keeps a cleared empty string on the next sync', () => {
    const cleared = whenReset(forcedGeneratedId({ generatedid: [{ value: '' }] }));
    expect(cleared.values.metadata.generatedid).toEqual([{ value: '' }]);
    expect(mockGenerateID).not.toHaveBeenCalled();
  });
});

describe('mergeSharedFormMetadata', () => {
  it('rebuilds shape while keeping existing dirty field values', () => {
    const properties = [textProp('a'), textProp('b'), textProp('c')];
    expect(
      mergeSharedFormMetadata({ a: [{ value: 'dirty-a' }] }, properties, {
        a: [{ value: 'entity-a' }],
        b: [{ value: 'entity-b' }],
        c: [{ value: 'entity-c' }],
      })
    ).toEqual({
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
