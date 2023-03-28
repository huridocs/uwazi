import { ImportFile } from 'api/csv/importFile';
import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import { flatThesaurusValues } from 'api/thesauri/thesauri';
import csv, { CSVRow } from './csv';
import { toSafeName } from './entityRow';
import { splitMultiselectLabels } from './typeParsers/multiselect';
import { normalizeThesaurusLabel } from './typeParsers/select';

const filterJSObject = (input: { [k: string]: any }, keys: string[]): { [k: string]: any } => {
  const result: { [k: string]: any } = {};
  keys.forEach(k => {
    if (input.hasOwnProperty(k)) {
      result[k] = input[k];
    }
  });
  return result;
};

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
};

const setupIdValueMaps = (allRelatedThesauri: WithId<ThesaurusSchema>[]): ThesauriValueData => {
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues = new Map();
  const thesauriIdToNormalizedNewValues = new Map();
  const thesauriIdToGroups = new Map();

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
  });

  return {
    thesauriIdToExistingValues,
    thesauriIdToNewValues,
    thesauriIdToNormalizedNewValues,
    thesauriIdToGroups,
  };
};

const handleRow = (
  row: CSVRow,
  propNameToThesauriId: Record<string, string | undefined>,
  newNameGeneration: boolean,
  thesauriValueData: ThesauriValueData
): void => {
  const safeNamedRow = toSafeName(row, newNameGeneration);
  // console.log('safeNamedRow', safeNamedRow)
  Object.entries(filterJSObject(propNameToThesauriId, Object.keys(safeNamedRow))).forEach(
    ([name, id]) => {
      const labels = splitMultiselectLabels(safeNamedRow[name]);
      Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
        if (thesauriValueData.thesauriIdToGroups.get(id)?.has(normalizedLabel)) {
          throw new Error(
            `The label "${originalLabel}" at property "${name}" is a group label in line:\n${JSON.stringify(
              row
            )}`
          );
        }
        if (
          !thesauriValueData.thesauriIdToExistingValues.get(id)?.has(normalizedLabel) &&
          !thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.has(normalizedLabel)
        ) {
          thesauriValueData.thesauriIdToNewValues.get(id)?.add(originalLabel);
          thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.add(normalizedLabel);
        }
      });
    }
  );
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

const arrangeThesauri = async (
  file: ImportFile,
  template: TemplateSchema,
  newNameGeneration: boolean,
  languages?: string[],
  stopOnError: boolean = true
): Promise<void> => {
  const thesauriRelatedProperties = template.properties?.filter(p =>
    ['select', 'multiselect'].includes(p.type)
  );

  const propNameToThesauriId = objectIndex(
    thesauriRelatedProperties || [],
    p => p.name,
    p => p.content?.toString()
  );

  const allRelatedThesauri = await thesauri.get({
    $in: Object.values(propNameToThesauriId),
  });

  const thesauriValueData = setupIdValueMaps(allRelatedThesauri);

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow) =>
      handleRow(row, propNameToThesauriId, newNameGeneration, thesauriValueData)
    )
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesauriValueData.thesauriIdToNewValues);
};

export { arrangeThesauri, ArrangeThesauriError };
