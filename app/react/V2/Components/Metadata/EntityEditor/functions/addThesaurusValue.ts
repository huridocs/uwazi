import type { ClientThesaurus, ClientThesaurusValue } from '#app/apiResponseTypes.js';
import { t } from '#app/I18N/index.js';
import type { ThesaurusInput } from '#shared/contracts/Thesaurus.js';

type ThesaurusLeaf = {
  id?: string;
  label: string;
};

type AddValueScope = {
  id: string;
  label: string;
  existingLabels: string[];
};

const ROOT_GROUP = 'root';

const foldLabel = (label: string) =>
  label.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

const displayLabel = (context: string, label: string) => {
  const translated = t(context, label, null, false);
  return typeof translated === 'string' ? translated : label;
};

const leavesIn = (values: ClientThesaurusValue[], groupId: string): ThesaurusLeaf[] => {
  if (groupId === ROOT_GROUP) {
    return values
      .filter(value => !value.values)
      .map(value => ({ id: value.id, label: value.label }));
  }
  const group = values.find(value => value.id === groupId);
  return (group?.values ?? []).map(child => ({ id: child.id, label: child.label }));
};

const findFoldMatch = (thesaurus: ClientThesaurus, label: string, groupId: string) => {
  const folded = foldLabel(label);
  return leavesIn(thesaurus.values, groupId).find(
    leaf => leaf.id && foldLabel(displayLabel(thesaurus._id, leaf.label)) === folded
  )?.id;
};

const addValueScopes = (thesaurus: ClientThesaurus): AddValueScope[] => {
  const rootLabels = thesaurus.values
    .filter(value => !value.values)
    .map(value => displayLabel(thesaurus._id, value.label));
  const groups = thesaurus.values.flatMap(value => {
    if (!value.values || !value.id) {
      return [];
    }
    return [
      {
        id: value.id,
        label: displayLabel(thesaurus._id, value.label),
        existingLabels: value.values.map(child => displayLabel(thesaurus._id, child.label)),
      },
    ];
  });
  return [{ id: ROOT_GROUP, label: '<root>', existingLabels: rootLabels }, ...groups];
};

const idByStoredLabel = (values: ClientThesaurusValue[], label: string, groupId: string) => {
  const folded = foldLabel(label);
  let found: string | undefined;
  leavesIn(values, groupId).forEach(leaf => {
    if (leaf.id && foldLabel(leaf.label) === folded) {
      found = leaf.id;
    }
  });
  return found;
};

const withAddedValue = (
  thesaurus: ClientThesaurus,
  label: string,
  groupId: string
): ThesaurusInput => ({
  _id: thesaurus._id,
  name: thesaurus.name,
  values:
    groupId === ROOT_GROUP
      ? [...thesaurus.values, { label }]
      : thesaurus.values.map(value =>
          value.id === groupId && value.values
            ? { ...value, values: [...value.values, { label }] }
            : value
        ),
});

export { addValueScopes, findFoldMatch, foldLabel, idByStoredLabel, withAddedValue };
export type { AddValueScope };
