import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { normalizeThesaurusLabel } from './select';
import { csvConstants } from '../csvDefinitions';
import { TypeParserError } from './errors';

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

type LabelInfoBase = {
  label: string;
  normalizedLabel: string;
};

type LabelInfo = LabelInfoBase & {
  child: LabelInfoBase | null;
};

function splitMultiselectLabels(labelString: string): {
  labels: string[];
  normalizedLabelToLabel: Record<string, string>;
  labelInfos: LabelInfo[];
} {
  const labels = labelString
    .split(csvConstants.multiValueSeparator)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const normalizedLabelToLabel: { [k: string]: string } = {};
  const labelInfos: LabelInfo[] = [];
  // eslint-disable-next-line max-statements
  labels.forEach(label => {
    const normalizedLabel = normalizeThesaurusLabel(label);

    if (labelNotNull(normalizedLabel) && !normalizedLabelToLabel.hasOwnProperty(normalizedLabel)) {
      normalizedLabelToLabel[normalizedLabel] = label;
    }

    if (labelNotNull(normalizedLabel)) {
      const split = label.split(csvConstants.dictionaryParentChildSeparator);
      const normalizedSplit = normalizedLabel.split(csvConstants.dictionaryParentChildSeparator);
      if (split.length > 2) {
        throw new TypeParserError(`Label "${label}" has too many parent-child separators.`);
      }
      const [parent, child] = split.length === 2 ? split : [split[0], null];
      const [normalizedParent, normalizedChild] =
        normalizedSplit.length === 2 ? normalizedSplit : [normalizedSplit[0], null];
      labelInfos.push({
        label: parent,
        normalizedLabel: normalizedParent,
        child: child && normalizedChild ? { label: child, normalizedLabel: normalizedChild } : null,
      });
    }
  });

  return { labels, normalizedLabelToLabel, labelInfos };
}

function normalizeMultiselectLabels(labelArray: string[]): string[] {
  const normalizedLabels = labelArray.map(l => normalizeThesaurusLabel(l)).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
}

const multiselect = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);

  const values = splitMultiselectLabels(
    entityToImport.propertiesFromColumns[ensure<string>(property.name)]
  ).normalizedLabelToLabel;
  const thesaurusValues = flatThesaurusValues(currentThesauri);

  return Object.keys(values)
    .map(key => thesaurusValues.find(tv => normalizeThesaurusLabel(tv.label) === key))
    .map(tv => tv)
    .map(tv => ({ value: ensure<string>(tv?.id), label: ensure<string>(tv?.label) }));
};

export default multiselect;
export { splitMultiselectLabels, normalizeMultiselectLabels };
export type { LabelInfo };
