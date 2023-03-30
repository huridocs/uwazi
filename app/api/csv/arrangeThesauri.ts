import _ from 'lodash';

import { ImportFile } from 'api/csv/importFile';
import translations from 'api/i18n/translations';
import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { ensure } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import csv, { CSVRow } from './csv';
import { toSafeName } from './entityRow';
import { splitMultiselectLabels } from './typeParsers/multiselect';
import { normalizeThesaurusLabel } from './typeParsers/select';

class ArrangeThesauriError extends Error {
  source: Error;

  row: CSVRow;

  index: number;

  constructor(source: Error, row: CSVRow, index: number) {
    super(source.message);
    this.source = source;
    this.row = row;
    this.index = index;
  }
}

type ThesauriValueData = {
  thesauriIdToExistingValues: Map<string, Set<string>>;
  thesauriIdToNewValues: Map<string, Set<string>>;
  thesauriIdToNormalizedNewValues: Map<string, Set<string>>;
  thesauriIdToGroups: Map<string, Set<string>>;
  thesauriIdToTranslations: Map<string, Record<string, Record<string, string>>>;
};

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

const setupIdValueMaps = (allRelatedThesauri: WithId<ThesaurusSchema>[]): ThesauriValueData => {
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues = new Map();
  const thesauriIdToNormalizedNewValues = new Map();
  const thesauriIdToGroups = new Map();
  const thesauriIdToTranslations = new Map();

  allRelatedThesauri.forEach(t => {
    const id = t._id.toString();
    const a = flatThesaurusValues(t, true);
    const thesaurusValues = a.map(v => normalizeThesaurusLabel(v.label));
    const thesaurusGroups =
      t.values?.filter(v => v.values).map(v => normalizeThesaurusLabel(v.label)) || [];
    thesauriIdToExistingValues.set(id, new Set(thesaurusValues));
    thesauriIdToNewValues.set(id, new Set());
    thesauriIdToNormalizedNewValues.set(id, new Set());
    thesauriIdToGroups.set(id, new Set(thesaurusGroups));
    thesauriIdToTranslations.set(id, {});
  });

  return {
    thesauriIdToExistingValues,
    thesauriIdToNewValues,
    thesauriIdToNormalizedNewValues,
    thesauriIdToGroups,
    thesauriIdToTranslations,
  };
};

const tryAddingLabel = (
  thesauriValueData: ThesauriValueData,
  normalizedLabel: string,
  originalLabel: string,
  name: string,
  id: any,
  row: CSVRow
): Set<string> => {
  if (thesauriValueData.thesauriIdToGroups.get(id)?.has(normalizedLabel)) {
    throw new Error(
      `The label "${originalLabel}" at property "${name}" is a group label in line:\n${JSON.stringify(
        row
      )}`
    );
  }
  const newKeys: Set<string> = new Set();
  if (
    !thesauriValueData.thesauriIdToExistingValues.get(id)?.has(normalizedLabel) &&
    !thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.has(normalizedLabel)
  ) {
    thesauriValueData.thesauriIdToNewValues.get(id)?.add(originalLabel);
    thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.add(normalizedLabel);
    newKeys.add(originalLabel);
  }
  return newKeys;
};

const tryAddingTranslation = (
  thesauriValueData: ThesauriValueData,
  potentialTranslations: (string | undefined)[][],
  newKeys: Set<string>
): void => {
  const { thesauriIdToTranslations } = thesauriValueData;
  potentialTranslations
    .filter(([id, language, key, value]) => id && language && key && value && newKeys.has(key))
    .forEach(([id, language, key, value]) => {
      if (id && language && key && value) {
        const translationDict = thesauriIdToTranslations.get(id) || {};
        const keysAndValues = translationDict[language] || {};
        keysAndValues[key] = value;
        translationDict[language] = keysAndValues;
        thesauriIdToTranslations.set(id, translationDict);
      }
    });
};

const handleRow = (
  row: CSVRow,
  propNameToThesauriId: Record<string, string | undefined>,
  newNameGeneration: boolean,
  thesauriValueData: ThesauriValueData,
  headersWithoutLanguage: string[],
  languagesPerHeader: Record<string, Set<string>>,
  defaultLanguage?: string
): void => {
  const safeNamedRow = toSafeName(row, newNameGeneration);
  headersWithoutLanguage.forEach(header => {
    const { normalizedLabelToLabel } = splitMultiselectLabels(safeNamedRow[header]);
    Object.entries(normalizedLabelToLabel).forEach(([normalizedLabel, originalLabel]) => {
      tryAddingLabel(
        thesauriValueData,
        normalizedLabel,
        originalLabel,
        header,
        propNameToThesauriId[header],
        row
      );
    });
  });
  Object.keys(languagesPerHeader).forEach(header => {
    const { labels: keys, normalizedLabelToLabel } = splitMultiselectLabels(
      safeNamedRow[`${header}__${defaultLanguage}`]
    );
    const potentialTranslations = Array.from(languagesPerHeader[header])
      .map(lang => {
        const fullHeader = `${header}__${lang}`;
        const translatedLabels = splitMultiselectLabels(safeNamedRow[fullHeader]).labels;
        return translatedLabels.map((trl, i) => [propNameToThesauriId[header], lang, keys[i], trl]);
      })
      .flat();
    Object.entries(normalizedLabelToLabel).forEach(([normalizedLabel, originalLabel]) => {
      const newKeys = tryAddingLabel(
        thesauriValueData,
        normalizedLabel,
        originalLabel,
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
  thesauriIdToNewValues: Map<string, Set<string>>
): Promise<void> => {
  const thesauriWithNewValues = allRelatedThesauri.filter(
    t => (thesauriIdToNewValues.get(t._id.toString()) || new Set()).size > 0
  );
  for (let i = 0; i < thesauriWithNewValues.length; i += 1) {
    const thesaurus = thesauriWithNewValues[i];
    const newValues = Array.from(thesauriIdToNewValues.get(thesaurus._id.toString()) || []).map(
      tval => ({ label: tval })
    );
    const thesaurusValues = thesaurus.values || [];
    // eslint-disable-next-line no-await-in-loop
    await thesauri.save({
      ...thesaurus,
      values: thesaurusValues.concat(newValues),
    });
  }
};

const syncUpdateTranslations = async (
  thesauriIdToTranslations: ThesauriValueData['thesauriIdToTranslations']
): Promise<void> => {
  const thesauriIds = Array.from(thesauriIdToTranslations.keys());
  for (let i = 0; i < thesauriIds.length; i += 1) {
    const thesauriId = thesauriIds[i];
    const thesaurusTranslations = thesauriIdToTranslations.get(thesauriId);
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
  defaultLanguage?: string,
  stopOnError: boolean = true
): Promise<Record<string, string>> => {
  const { propNameToThesauriId, headersWithoutLanguage, languagesPerHeader, allRelatedThesauri } =
    await setupProperties(template, _headersWithoutLanguage, _languagesPerHeader);

  const thesauriValueData = setupIdValueMaps(allRelatedThesauri);

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow) =>
      handleRow(
        row,
        propNameToThesauriId,
        newNameGeneration,
        thesauriValueData,
        headersWithoutLanguage,
        languagesPerHeader,
        defaultLanguage
      )
    )
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesauriValueData.thesauriIdToNewValues);
  await syncUpdateTranslations(thesauriValueData.thesauriIdToTranslations);

  return propNameToThesauriId;
};

export { arrangeThesauri, ArrangeThesauriError };
