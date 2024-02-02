/* eslint-disable max-lines */
/* eslint-disable max-statements */
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
import { DoubleIndexedObject } from 'shared/data_utils/DoubleIndexedObject';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import csv, { CSVRow } from './csv';
import { toSafeName } from './entityRow';
import { LabelInfo, splitMultiselectLabels } from './typeParsers/multiselect';
import { headerWithLanguage } from './csvDefinitions';
import { Arrays } from 'shared/data_utils/arrays';

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

const logTheasaurusMaps = (maps: ThesaurusMaps) => {
  Object.entries(maps).forEach(([id, map]) => {
    console.log('id', id);
    console.log('normalizedLabelsPerParent', map.normalizedLabelsPerParent.sets);
    console.log('newInfos', map.newInfos);
    console.log('newNormalizedLabelsPerParent', map.newNormalizedLabelsPerParent.sets);
    console.log('translations', map.translations.obj);
  });
};

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

  // logTheasaurusMaps(maps);

  return maps;
};

const isStandaloneGroup = (thesaurusMap: ThesaurusMap, labelInfo: LabelInfo): boolean =>
  !labelInfo.child && labelInfo.normalizedLabel in thesaurusMap.normalizedLabelsPerParent;

const tryAddingLabel = (
  thesauriValueData: ThesaurusMaps,
  labelInfo: LabelInfo,
  name: string,
  id: any,
  row: CSVRow
): Set<string> => {
  const map = thesauriValueData[id];
  if (isStandaloneGroup(map, labelInfo)) {
    throw new Error(
      `The label "${
        labelInfo.label
      }" at property "${name}" is a group label in line:\n${JSON.stringify(row)}`
    );
  }
  const childInfo = labelInfo.child ? labelInfo.child : labelInfo;
  const parentInfo = labelInfo.child ? labelInfo : { label: '', normalizedLabel: '' };
  const newKeys: Set<string> = new Set();

  // TODO fix it here --------------------------------------------------- !
  if (
    !map.normalizedLabelsPerParent.has(parentInfo.normalizedLabel, childInfo.normalizedLabel) &&
    !map.newNormalizedLabelsPerParent.has(parentInfo.normalizedLabel, childInfo.normalizedLabel)
  ) {
    map.newInfos.push(labelInfo);
    const addition = map.newNormalizedLabelsPerParent.add(
      parentInfo.normalizedLabel,
      childInfo.normalizedLabel
    );
    if (addition.indexWasNew) newKeys.add(parentInfo.label);
    if (addition.valueWasNew) newKeys.add(childInfo.label);
  }
  return newKeys;
};

const tryAddingTranslation = (
  thesauriValueData: ThesaurusMaps,
  potentialTranslations: (string | undefined)[][],
  newKeys: Set<string>
): void => {
  // const { thesauriIdToTranslations } = thesauriValueData;
  potentialTranslations
    .filter(([id, language, key, value]) => id && language && key && value && newKeys.has(key))
    .forEach(([id, language, key, value]) => {
      if (id && language && key && value) {
        // const translationDict = thesauriIdToTranslations.get(id) || {};
        // const keysAndValues = translationDict[language] || {};
        // keysAndValues[key] = value;
        // translationDict[language] = keysAndValues;
        // thesauriIdToTranslations.set(id, translationDict);
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
  defaultLanguage: string
): void => {
  const safeNamedRow = toSafeName(row, newNameGeneration);
  headersWithoutLanguage.forEach(header => {
    const { labelInfos } = splitMultiselectLabels(safeNamedRow[header]);
    labelInfos.forEach(labelInfo => {
      tryAddingLabel(thesauriValueData, labelInfo, header, propNameToThesauriId[header], row);
    });
  });
  Object.keys(languagesPerHeader).forEach(header => {
    const {
      // labels: keys,
      normalizedLabelToLabel,
      labelInfos: keyInfos,
    } = splitMultiselectLabels(safeNamedRow[headerWithLanguage(header, defaultLanguage)]);
    const potentialTranslations = Array.from(languagesPerHeader[header])
      .map(lang => {
        const fullHeader = headerWithLanguage(header, lang);
        const translatedLabels = splitMultiselectLabels(safeNamedRow[fullHeader]).labels;
        const { labelInfos } = splitMultiselectLabels(safeNamedRow[fullHeader]);
        // return translatedLabels.map((trl, i) => [propNameToThesauriId[header], lang, keys[i], trl]);
        // TODO: this does not handle parent-child relationships yet, but finish the flow first
        return labelInfos.map((labelInfo, i) => [
          propNameToThesauriId[header],
          lang,
          keyInfos[i].label,
          labelInfo.label,
        ]);
      })
      .flat();
    console.log('potentialTranslations', potentialTranslations);
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
    // Object.entries(normalizedLabelToLabel).forEach(([normalizedLabel, originalLabel]) => {
    //   const newKeys = tryAddingLabel(
    //     thesauriValueData,
    //     normalizedLabel,
    //     originalLabel,
    //     header,
    //     propNameToThesauriId[header],
    //     row
    //   );
    //   if (newKeys.size) tryAddingTranslation(thesauriValueData, potentialTranslations, newKeys);
    // });
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
    // const { sets } = thesaurusMaps[thesaurus._id.toString()].newLabelsPerParent;
    // let newValues: ThesaurusSchema['values'] = Object.entries(sets)
    //   .filter(([parent]) => parent !== '')
    //   .map(([parent, children]) => ({
    //     label: parent,
    //     values: Array.from(children).map(child => ({ label: child })),
    //   }));
    // newValues = newValues.concat(Array.from(sets['']).map(label => ({ label })));
    const { newInfos } = thesaurusMaps[thesaurus._id.toString()];
    console.log('newInfos', newInfos);
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

    console.log('newValues', newValues);

    const newThesaurus = thesauri.appendValues(thesaurus, newValues);
    console.log('newThesaurus', newThesaurus);
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
): Promise<Record<string, string>> => {
  const { propNameToThesauriId, headersWithoutLanguage, languagesPerHeader, allRelatedThesauri } =
    await setupProperties(template, _headersWithoutLanguage, _languagesPerHeader);

  const thesaurusMaps = setupThesaurusMaps(allRelatedThesauri);

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow) =>
      handleRow(
        row,
        propNameToThesauriId,
        newNameGeneration,
        thesaurusMaps,
        headersWithoutLanguage,
        languagesPerHeader,
        defaultLanguage
      )
    )
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesaurusMaps);
  await syncUpdateTranslations(thesaurusMaps);

  return propNameToThesauriId;
};

export { arrangeThesauri, ArrangeThesauriError };
