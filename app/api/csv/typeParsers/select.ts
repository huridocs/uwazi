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

const determineParentChildRelationship = (label: string): LabelInfo | null => {
  const normalizedLabel = normalizeThesaurusLabel(label);
  if (!normalizedLabel) return null;
  const split = label.split(csvConstants.dictionaryParentChildSeparator);
  const normalizedSplit = normalizedLabel.split(csvConstants.dictionaryParentChildSeparator);
  if (split.length > 2) {
    throw new TypeParserError(`Label "${label}" has too many parent-child separators.`);
  }
  const [parent, child] = split.length === 2 ? split : [split[0], null];
  const [normalizedParent, normalizedChild] =
    normalizedSplit.length === 2 ? normalizedSplit : [normalizedSplit[0], null];
  return {
    label: parent,
    normalizedLabel: normalizedParent,
    child: child && normalizedChild ? { label: child, normalizedLabel: normalizedChild } : null,
  };
};

const generateMetadataValue = (currentThesaurus: ThesaurusSchema, labelInfo: LabelInfo) => {
  // console.log('currentThesaurus', currentThesaurus.values)
  // console.log('labelInfo', labelInfo)
  const parent = currentThesaurus.values?.find(
    v => normalizeThesaurusLabel(v.label) === labelInfo.normalizedLabel
  );
  // console.log('parent', parent)
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
export type { LabelInfo };
export { determineParentChildRelationship, generateMetadataValue };
