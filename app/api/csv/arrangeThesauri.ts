import { ImportFile } from 'api/csv/importFile';
import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
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

const createNameToIdMap = (
  thesauriRelatedProperties: PropertySchema[] | undefined,
  languages?: string[]
): { [k: string]: string } => {
  const nameToThesauriId: { [k: string]: string } = {};

  thesauriRelatedProperties?.forEach(p => {
    if (p.content && p.type) {
      const thesarusID = p.content.toString();
      nameToThesauriId[p.name] = thesarusID;
      languages?.forEach(suffix => {
        nameToThesauriId[`${p.name}__${suffix}`] = thesarusID;
      });
    }
  });

  return nameToThesauriId;
};

type ThesauriValueData = {
  thesauriIdToExistingValues: Map<string, Set<string>>;
  thesauriIdToNewValues: Map<string, Set<string>>;
  thesauriIdToNormalizedNewValues: Map<string, Set<string>>;
};

const setupIdValueMaps = (allRelatedThesauri: WithId<ThesaurusSchema>[]): ThesauriValueData => {
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues = new Map();
  const thesauriIdToNormalizedNewValues = new Map();

  allRelatedThesauri.forEach(t => {
    const id = t._id.toString();
    const a = flatThesaurusValues(t, true);
    const thesaurusValues = a.map(v => normalizeThesaurusLabel(v.label));
    thesauriIdToExistingValues.set(id, new Set(thesaurusValues));
    thesauriIdToNewValues.set(id, new Set());
    thesauriIdToNormalizedNewValues.set(id, new Set());
  });

  return { thesauriIdToExistingValues, thesauriIdToNewValues, thesauriIdToNormalizedNewValues };
};

const syncSaveThesauri = async (
  allRelatedThesauri: WithId<ThesaurusSchema>[],
  thesauriIdToNewValues: Map<string, Set<string>>
) => {
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
) => {
  const thesauriRelatedProperties = template.properties?.filter(p =>
    ['select', 'multiselect'].includes(p.type)
  );

  const nameToThesauriId = createNameToIdMap(thesauriRelatedProperties, languages);

  const allRelatedThesauri = await thesauri.get({
    $in: Array.from(
      new Set(thesauriRelatedProperties?.map(p => p.content?.toString()).filter(t => t))
    ),
  });

  const thesauriValueData = setupIdValueMaps(allRelatedThesauri);

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow) => {
      const safeNamedRow = toSafeName(row, newNameGeneration);
      Object.entries(filterJSObject(nameToThesauriId, Object.keys(safeNamedRow))).forEach(
        ([name, id]) => {
          const labels = splitMultiselectLabels(safeNamedRow[name]);
          Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
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
    })
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesauriValueData.thesauriIdToNewValues);
};

export { arrangeThesauri, ArrangeThesauriError };
