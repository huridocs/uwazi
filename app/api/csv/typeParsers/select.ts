import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { csvConstants } from '../csvDefinitions';
import { TypeParserError } from './errors';

type LabelInfoBase = {
  label: string;
  normalizedLabel: string;
};

type LabelInfo = LabelInfoBase & {
  child: LabelInfoBase | null;
};

const splitLabel = (
  label: string
): {
  split: string[];
  normalizedSplit: string[];
} | null => {
  const normalizedLabel = normalizeThesaurusLabel(label);
  if (!normalizedLabel) return null;
  const split = label.split(csvConstants.dictionaryParentChildSeparator);
  const normalizedSplit = normalizedLabel.split(csvConstants.dictionaryParentChildSeparator);
  if (split.length > 2) {
    throw new TypeParserError(`Label "${label}" has too many parent-child separators.`);
  }
  return { split, normalizedSplit };
};

const pickParentChild = (
  split: string[],
  normalizedSplit: string[]
): {
  parent: string;
  child: string | null;
  normalizedParent: string;
  normalizedChild: string | null;
} => {
  const [parent, child] = split.length === 2 ? split : [split[0], null];
  const [normalizedParent, normalizedChild] =
    normalizedSplit.length === 2 ? normalizedSplit : [normalizedSplit[0], null];
  return { parent, child, normalizedParent, normalizedChild };
};

const determineParentChildRelationship = (label: string): LabelInfo | null => {
  const splitLabelResult = splitLabel(label);
  if (!splitLabelResult) return null;
  const { split, normalizedSplit } = splitLabelResult;
  const { parent, child, normalizedParent, normalizedChild } = pickParentChild(
    split,
    normalizedSplit
  );
  return {
    label: parent,
    normalizedLabel: normalizedParent,
    child: child && normalizedChild ? { label: child, normalizedLabel: normalizedChild } : null,
  };
};

const generateMetadataValue = (currentThesaurus: ThesaurusSchema, labelInfo: LabelInfo) => {
  const parent = currentThesaurus.values?.find(
    v => normalizeThesaurusLabel(v.label) === labelInfo.normalizedLabel
  );
  if (labelInfo.child) {
    const child = parent?.values?.find(
      v => normalizeThesaurusLabel(v.label) === labelInfo.child?.normalizedLabel
    );
    return {
      value: ensure<string>(child?.id),
      label: ensure<string>(child?.label),
      parent: {
        value: ensure<string>(parent?.id),
        label: ensure<string>(parent?.label),
      },
    };
  }
  return {
    value: ensure<string>(parent?.id),
    label: ensure<string>(parent?.label),
  };
};

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[] | null> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const propValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const labelInfo = determineParentChildRelationship(propValue);

  return labelInfo ? [generateMetadataValue(currentThesauri, labelInfo)] : null;
};

export default select;
export type { LabelInfo, LabelInfoBase };
export { determineParentChildRelationship, generateMetadataValue };
