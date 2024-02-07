import _ from 'lodash';

import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import { LabelInfo, determineParentChildRelationship, generateMetadataValue } from './select';
import { csvConstants } from '../csvDefinitions';

function labelNotNull(label: string | null): label is string {
  return label !== null;
}

function splitMultiselectLabels(labelString: string): {
  labelInfos: LabelInfo[];
} {
  const labels = labelString
    .split(csvConstants.multiValueSeparator)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const labelInfos: LabelInfo[] = [];
  labels.forEach(label => {
    const labelInfo = determineParentChildRelationship(label);
    if (labelInfo) labelInfos.push(labelInfo);
  });

  return { labelInfos };
}

function normalizeMultiselectLabels(labelArray: string[]): string[] {
  const normalizedLabels = labelArray.map(l => normalizeThesaurusLabel(l)).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
}

const multiselect = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => {
  const currentThesaurus = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);

  const info = _.uniqBy(
    splitMultiselectLabels(entityToImport.propertiesFromColumns[ensure<string>(property.name)])
      .labelInfos,
    i => i.child?.normalizedLabel || i.normalizedLabel
  );

  const values = info.map(i => generateMetadataValue(currentThesaurus, i));

  return values;
};

export default multiselect;
export { splitMultiselectLabels, normalizeMultiselectLabels };
export type { LabelInfo };
