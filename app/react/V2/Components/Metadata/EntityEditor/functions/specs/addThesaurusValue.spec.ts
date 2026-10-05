import type { ClientThesaurus } from '#app/apiResponseTypes.js';
import {
  addValueScopes,
  findFoldMatch,
  foldLabel,
  idByStoredLabel,
  withAddedValue,
} from '../addThesaurusValue.js';

jest.mock('#app/I18N/index.js', () => ({
  t: (_context: string, key: string) => (key === 'Idle' ? 'Inactivo' : key),
}));

const thesaurus: ClientThesaurus = {
  _id: 'status',
  name: 'Estado',
  values: [
    {
      id: 'group',
      label: 'Amnistía',
      values: [{ id: 'child', label: 'Child' }],
    },
    { id: 'idle', label: 'Idle' },
    { id: 'closed', label: 'Closed' },
    { id: 'again', label: 'Inactivo' },
  ],
};

describe('foldLabel', () => {
  it('folds case, accents, and surrounding space', () => {
    expect(foldLabel('  ÁMNISTIA ')).toBe('amnistia');
    expect(foldLabel('Amnistía')).toBe(foldLabel('amnistia'));
  });
});

describe('findFoldMatch', () => {
  it('matches only leaves in the chosen group, or root leaves when the group is root', () => {
    expect(findFoldMatch(thesaurus, '  INACTIVO ', 'root')).toBe('idle');
    expect(findFoldMatch(thesaurus, 'child', 'root')).toBeUndefined();
    expect(findFoldMatch(thesaurus, 'child', 'group')).toBe('child');
    expect(findFoldMatch(thesaurus, 'amnistia', 'root')).toBeUndefined();
    expect(findFoldMatch(thesaurus, 'missing', 'group')).toBeUndefined();
  });
});

describe('addValueScopes', () => {
  it('offers root and each group when the thesaurus is nested', () => {
    expect(addValueScopes(thesaurus)).toEqual([
      { id: 'root', label: '<root>', existingLabels: ['Inactivo', 'Closed', 'Inactivo'] },
      { id: 'group', label: 'Amnistía', existingLabels: ['Child'] },
    ]);
  });

  it('offers only root labels when the thesaurus has no groups', () => {
    expect(addValueScopes({ ...thesaurus, values: [{ id: 'idle', label: 'Idle' }] })).toEqual([
      { id: 'root', label: '<root>', existingLabels: ['Inactivo'] },
    ]);
  });
});

describe('withAddedValue', () => {
  it('appends a root value with only a label', () => {
    expect(withAddedValue(thesaurus, '  New ', 'root')).toEqual({
      _id: 'status',
      name: 'Estado',
      values: [...thesaurus.values, { label: '  New ' }],
    });
  });

  it('appends the label inside the chosen group', () => {
    expect(withAddedValue(thesaurus, 'Nepal', 'group').values[0]).toEqual({
      id: 'group',
      label: 'Amnistía',
      values: [{ id: 'child', label: 'Child' }, { label: 'Nepal' }],
    });
  });
});

describe('idByStoredLabel', () => {
  it('reads the id from the chosen group, not a same label elsewhere', () => {
    const values = [
      { id: 'group', label: 'Amnistía', values: [{ id: 'child', label: 'Nepal' }] },
      { id: 'root-nepal', label: 'Nepal' },
    ];
    expect(idByStoredLabel(values, 'Nepal', 'group')).toBe('child');
    expect(idByStoredLabel(values, 'Nepal', 'root')).toBe('root-nepal');
  });
});
