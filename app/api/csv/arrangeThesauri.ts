/* eslint-disable max-statements */
/* eslint-disable max-lines */
import _ from 'lodash';

import { ImportFile } from 'api/csv/importFile';
import translations from 'api/i18n/translations';
import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { Sets } from 'shared/data_utils/sets';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { Arrays } from 'shared/data_utils/arrays';
import { DoubleIndexedObject } from 'shared/data_utils/DoubleIndexedObject';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import csv, { CSVRow } from './csv';
import { toSafeName } from './entityRow';
import { LabelInfo, splitMultiselectLabels } from './typeParsers/multiselect';
import { determineParentChildRelationship } from './typeParsers/select';
import { headerWithLanguage } from './csvDefinitions';
import { sanitizeStringValue } from './sanitizationUtils';
import { LabelInfoBase } from './typeParsers/shared';

class ArrangeThesauriError extends Error {
  row: CSVRow;

  index: number;

  constructor(source: Error, row: CSVRow, index: number) {
    super(source.message, { cause: source });
    this.row = row;
    this.index = index;
  }
}

type PropertyWithContent = PropertySchema & { content: string };

const setupProperties = async (
  template: TemplateSchema,
  _headersWithoutLanguage: string[],
  _languagesPerHeader: Record<string, Set<string>>
): Promise<{
  propNameToThesauriId: Record<string, string>;
  headersWithoutLanguage: string[];
  languagesPerHeader: Record<string, Set<string>>;
  allRelatedThesauri: WithId<ThesaurusSchema>[];
}> => {
  const thesauriRelatedProperties: PropertyWithContent[] = ensure<PropertyWithContent[]>(
    template.properties
      ?.filter(p => ['select', 'multiselect'].includes(p.type))
      .filter(p => p.content) || []
  );

  const propNameToThesauriId = objectIndex(
    thesauriRelatedProperties || [],
    p => p.name,
    p => p.content.toString()
  );

  const propNames = new Set(Object.keys(propNameToThesauriId));
  const headersWithoutLanguage = _headersWithoutLanguage.filter(h => propNames.has(h));
  const languagesPerHeader = _.pick(
    _languagesPerHeader,
    Object.keys(_languagesPerHeader).filter(h => propNames.has(h))
  );

  const allRelatedThesauri = await thesauri.get({
    $in: Object.values(propNameToThesauriId),
  });

  return {
    propNameToThesauriId,
    headersWithoutLanguage,
    languagesPerHeader,
    allRelatedThesauri,
  };
};

type ThesaurusMap = {
  normalizedLabelsPerParent: Sets<string>;
  newInfos: LabelInfo[];
  newNormalizedLabelsPerParent: Sets<string>;
  translations: DoubleIndexedObject<string, string>;
};

type ThesaurusMaps = Record<string, ThesaurusMap>;

const setupThesaurusMaps = (allRelatedThesauri: WithId<ThesaurusSchema>[]): ThesaurusMaps => {
  const maps: ThesaurusMaps = {};

  allRelatedThesauri.forEach(t => {
    const id = t._id.toString();

    const normalizedLabelsPerParent: Sets<string> = new Sets({ '': [] });
    (t.values || []).forEach(v => {
      const normalizedLabel = normalizeThesaurusLabel(v.label);
      if (!normalizedLabel) return;
      const isParent = v.values;
      if (isParent) {
        (v.values || []).forEach(child => {
          const childNormalizedLabel = normalizeThesaurusLabel(child.label);
          if (childNormalizedLabel) {
            normalizedLabelsPerParent.add(normalizedLabel, childNormalizedLabel);
          }
        });
      } else {
        normalizedLabelsPerParent.add('', normalizedLabel);
      }
    });
    maps[id] = {
      normalizedLabelsPerParent,
      newInfos: [],
      newNormalizedLabelsPerParent: new Sets({ '': [] }),
      translations: new DoubleIndexedObject(),
    };
  });

  return maps;
};

const isStandaloneGroup = (thesaurusMap: ThesaurusMap, labelInfo: LabelInfo): boolean =>
  !labelInfo.child && thesaurusMap.normalizedLabelsPerParent.has(labelInfo.normalizedLabel);

const pickParentChild = (labelInfo: LabelInfo) => {
  const childInfo = labelInfo.child ? labelInfo.child : labelInfo;
  const parentInfo = labelInfo.child ? labelInfo : { label: '', normalizedLabel: '' };
  return { childInfo, parentInfo };
};

const isNewLabel = (
  map: ThesaurusMap,
  parentInfo: LabelInfoBase,
  childInfo: LabelInfoBase
): boolean => {
  const hasInExisting = map.normalizedLabelsPerParent.has(
    parentInfo.normalizedLabel,
    childInfo.normalizedLabel
  );
  const hasInNew = map.newNormalizedLabelsPerParent.has(
    parentInfo.normalizedLabel,
    childInfo.normalizedLabel
  );
  const isNew = !hasInExisting && !hasInNew;

  return isNew;
};

function sanitizeLabelInfo(labelInfo: LabelInfo, propertyName: string): LabelInfo {
  const sanitizedLabel = sanitizeStringValue(labelInfo.label, propertyName).value;

  if (labelInfo.child) {
    const sanitizedChildLabel = sanitizeStringValue(labelInfo.child.label, propertyName).value;

    return {
      label: sanitizedLabel,
      normalizedLabel: normalizeThesaurusLabel(sanitizedLabel) || '',
      child: {
        label: sanitizedChildLabel,
        normalizedLabel: normalizeThesaurusLabel(sanitizedChildLabel) || '',
      },
    };
  }

  return {
    label: sanitizedLabel,
    normalizedLabel: normalizeThesaurusLabel(sanitizedLabel) || '',
    child: null,
  };
}

function parseParentChildWithSpaces(value: string): LabelInfo | null {
  if (!value) return null;

  const separator = '::';
  const parts = value.split(separator);

  if (parts.length > 2) {
    return null;
  }

  if (parts.length === 1) {
    const trimmedLabel = parts[0].trim();
    const normalizedLabel = normalizeThesaurusLabel(trimmedLabel);
    if (!normalizedLabel) return null;

    return {
      label: trimmedLabel,
      normalizedLabel,
      child: null,
    };
  }

  const parentLabel = parts[0].trim();
  const childLabel = parts[1].trim();

  const normalizedParentLabel = normalizeThesaurusLabel(parentLabel);
  const normalizedChildLabel = normalizeThesaurusLabel(childLabel);

  if (!normalizedParentLabel || !normalizedChildLabel) {
    return null;
  }

  return {
    label: parentLabel,
    normalizedLabel: normalizedParentLabel,
    child: {
      label: childLabel,
      normalizedLabel: normalizedChildLabel,
    },
  };
}

const pushNewLabel = (
  map: ThesaurusMap,
  labelInfo: LabelInfo,
  newKeys: Set<string>,
  propertyName: string
) => {
  const sanitizedLabelInfo = sanitizeLabelInfo(labelInfo, propertyName);
  const sanitizedParentInfo = sanitizedLabelInfo.child
    ? sanitizedLabelInfo
    : { label: sanitizedLabelInfo.label, normalizedLabel: sanitizedLabelInfo.normalizedLabel };
  const sanitizedChildInfo = sanitizedLabelInfo.child
    ? sanitizedLabelInfo.child
    : sanitizedLabelInfo;

  map.newInfos.push(sanitizedLabelInfo);
  const addition = map.newNormalizedLabelsPerParent.add(
    sanitizedParentInfo.normalizedLabel,
    sanitizedChildInfo.normalizedLabel
  );
  if (addition.indexWasNew) newKeys.add(sanitizedParentInfo.label);
  if (addition.valueWasNew) newKeys.add(sanitizedChildInfo.label);
};

const tryAddingLabel = (
  thesauriValueData: ThesaurusMaps,
  labelInfo: LabelInfo,
  name: string,
  id: any,
  row: CSVRow
  // eslint-disable-next-line max-params
): Set<string> => {
  const map = thesauriValueData[id];
  if (isStandaloneGroup(map, labelInfo)) {
    throw new Error(
      `The label "${labelInfo.label}" at property "${name}" is a group label in line:\n${JSON.stringify(row)}`
    );
  }
  const { childInfo, parentInfo } = pickParentChild(labelInfo);
  const newKeys: Set<string> = new Set();

  if (isNewLabel(map, parentInfo, childInfo)) {
    pushNewLabel(map, labelInfo, newKeys, name);
  }
  return newKeys;
};

const tryAddingTranslation = (
  thesauriValueData: ThesaurusMaps,
  potentialTranslations: (string | undefined)[][],
  newKeys: Set<string>
): void => {
  potentialTranslations
    .filter(([id, language, key, value]) => id && language && key && value && newKeys.has(key))
    .forEach(([id, language, key, value]) => {
      if (id && language && key && value) {
        thesauriValueData[id].translations.set(language, key, value);
      }
    });
};

const handleRow = (
  row: CSVRow,
  propNameToThesauriId: Record<string, string | undefined>,
  newNameGeneration: boolean,
  thesauriValueData: ThesaurusMaps,
  headersWithoutLanguage: string[],
  languagesPerHeader: Record<string, Set<string>>,
  defaultLanguage: string,
  template: TemplateSchema
  // eslint-disable-next-line max-params
): void => {
  const safeNamedRow = toSafeName(row, newNameGeneration);

  headersWithoutLanguage.forEach(header => {
    const property = template.properties?.find(p => p.name === header);
    const isMultiselect = property?.type === 'multiselect';

    if (isMultiselect) {
      const result = splitMultiselectLabels(safeNamedRow[header]);
      result.labelInfos.forEach(labelInfo => {
        tryAddingLabel(thesauriValueData, labelInfo, header, propNameToThesauriId[header], row);
      });
    } else {
      let labelInfo = determineParentChildRelationship(safeNamedRow[header]);

      if (!labelInfo && safeNamedRow[header]) {
        const sanitizedValue = sanitizeStringValue(safeNamedRow[header], header).value;
        labelInfo = determineParentChildRelationship(sanitizedValue);
      }

      if (!labelInfo && safeNamedRow[header]) {
        labelInfo = parseParentChildWithSpaces(safeNamedRow[header]);
      }

      if (labelInfo) {
        tryAddingLabel(thesauriValueData, labelInfo, header, propNameToThesauriId[header], row);
      }
    }
  });

  Object.keys(languagesPerHeader).forEach(header => {
    const defaultLanguageHeader = headerWithLanguage(header, defaultLanguage);

    const property = template.properties?.find(p => p.name === header);
    const isMultiselect = property?.type === 'multiselect';

    let keyInfos: LabelInfo[] = [];
    if (isMultiselect) {
      const result = splitMultiselectLabels(safeNamedRow[defaultLanguageHeader]);
      keyInfos = result.labelInfos;
    } else {
      let labelInfo = determineParentChildRelationship(safeNamedRow[defaultLanguageHeader]);

      if (!labelInfo && safeNamedRow[defaultLanguageHeader]) {
        const sanitizedValue = sanitizeStringValue(
          safeNamedRow[defaultLanguageHeader],
          header
        ).value;
        labelInfo = determineParentChildRelationship(sanitizedValue);
      }

      if (!labelInfo && safeNamedRow[defaultLanguageHeader]) {
        labelInfo = parseParentChildWithSpaces(safeNamedRow[defaultLanguageHeader]);
      }

      if (labelInfo) {
        keyInfos = [labelInfo];
      }
    }

    const potentialTranslations = Array.from(languagesPerHeader[header])
      .map(lang => {
        const fullHeader = headerWithLanguage(header, lang);
        let labelInfos: LabelInfo[] = [];
        if (isMultiselect) {
          const result = splitMultiselectLabels(safeNamedRow[fullHeader]);
          labelInfos = result.labelInfos;
        } else {
          let labelInfo = determineParentChildRelationship(safeNamedRow[fullHeader]);

          if (!labelInfo && safeNamedRow[fullHeader]) {
            const sanitizedValue = sanitizeStringValue(safeNamedRow[fullHeader], header).value;
            labelInfo = determineParentChildRelationship(sanitizedValue);
          }

          if (!labelInfo && safeNamedRow[fullHeader]) {
            labelInfo = parseParentChildWithSpaces(safeNamedRow[fullHeader]);
          }

          if (labelInfo) {
            labelInfos = [labelInfo];
          }
        }

        const ptrs: (string | undefined)[][] = [];
        labelInfos.forEach((labelInfo, i) => {
          const keyInfo = keyInfos[i];
          ptrs.push([propNameToThesauriId[header], lang, keyInfo.label, labelInfo.label]);
          if (labelInfo.child && keyInfo.child) {
            ptrs.push([
              propNameToThesauriId[header],
              lang,
              keyInfo.child.label,
              labelInfo.child.label,
            ]);
          }
        });
        return ptrs;
      })
      .flat();
    keyInfos.forEach(labelInfo => {
      const newKeys = tryAddingLabel(
        thesauriValueData,
        labelInfo,
        header,
        propNameToThesauriId[header],
        row
      );
      if (newKeys.size) tryAddingTranslation(thesauriValueData, potentialTranslations, newKeys);
    });
  });
};

const syncSaveThesauri = async (
  allRelatedThesauri: WithId<ThesaurusSchema>[],
  thesaurusMaps: ThesaurusMaps
): Promise<void> => {
  const thesauriWithNewLabels = allRelatedThesauri.filter(
    t => thesaurusMaps[t._id.toString()].newInfos.length > 0
  );
  for (let i = 0; i < thesauriWithNewLabels.length; i += 1) {
    const thesaurus = thesauriWithNewLabels[i];
    const { newInfos } = thesaurusMaps[thesaurus._id.toString()];
    const normalizedRootLabelsToOriginalRootLabels: Record<string, string> = {};
    const normalizedRootLabelsToChildLabels: Arrays<string> = new Arrays();
    newInfos.forEach(info => {
      if (!(info.normalizedLabel in normalizedRootLabelsToOriginalRootLabels)) {
        normalizedRootLabelsToOriginalRootLabels[info.normalizedLabel] = info.label;
      }
      if (info.child) {
        normalizedRootLabelsToChildLabels.push(info.normalizedLabel, info.child.label);
      }
    });

    const newValues: ThesaurusSchema['values'] = Object.keys(
      normalizedRootLabelsToOriginalRootLabels
    ).map(normalizedLabel => {
      const rootValue = {
        label: normalizedRootLabelsToOriginalRootLabels[normalizedLabel],
      };
      const potentialChildrenLabels = normalizedRootLabelsToChildLabels.get(normalizedLabel);
      const newValue = potentialChildrenLabels
        ? { ...rootValue, values: potentialChildrenLabels.map(label => ({ label })) }
        : rootValue;
      return newValue;
    });

    const newThesaurus = thesauri.appendValues(thesaurus, newValues);
    // eslint-disable-next-line no-await-in-loop
    await thesauri.save(newThesaurus);
  }
};

const syncUpdateTranslations = async (thesaurusMaps: ThesaurusMaps): Promise<void> => {
  const thesauriIds = Object.keys(thesaurusMaps);
  for (let i = 0; i < thesauriIds.length; i += 1) {
    const thesauriId = thesauriIds[i];
    const thesaurusTranslations = thesaurusMaps[thesauriId].translations.obj;
    // eslint-disable-next-line no-await-in-loop
    if (thesaurusTranslations) await translations.updateEntries(thesauriId, thesaurusTranslations);
  }
};

const arrangeThesauri = async (
  file: ImportFile,
  template: TemplateSchema,
  newNameGeneration: boolean,
  _headersWithoutLanguage: string[],
  _languagesPerHeader: Record<string, Set<string>>,
  defaultLanguage: string,
  stopOnError: boolean = true
  // eslint-disable-next-line max-params
): Promise<Record<string, string>> => {
  const { propNameToThesauriId, headersWithoutLanguage, languagesPerHeader, allRelatedThesauri } =
    await setupProperties(template, _headersWithoutLanguage, _languagesPerHeader);

  const thesaurusMaps = setupThesaurusMaps(allRelatedThesauri);

  let firstError: ArrangeThesauriError | null = null;

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow) =>
      handleRow(
        row,
        propNameToThesauriId,
        newNameGeneration,
        thesaurusMaps,
        headersWithoutLanguage,
        languagesPerHeader,
        defaultLanguage,
        template
      )
    )
    .onError(async (e: Error, row: CSVRow, index: number) => {
      if (!firstError) {
        firstError = new ArrangeThesauriError(e, row, index);
      }
    })
    .read();

  if (firstError) {
    throw firstError;
  }

  await syncSaveThesauri(allRelatedThesauri, thesaurusMaps);
  await syncUpdateTranslations(thesaurusMaps);

  return propNameToThesauriId;
};

export { arrangeThesauri, ArrangeThesauriError };
