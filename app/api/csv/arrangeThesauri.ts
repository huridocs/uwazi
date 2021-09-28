import { ImportFile } from 'api/csv/importFile';
import thesauri from 'api/thesauri';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import csv, { CSVRow } from './csv';
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

const setupIdValueMaps = (allRelatedThesauri: ThesaurusSchema[]): ThesauriValueData => {
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues = new Map();
  const thesauriIdToNormalizedNewValues = new Map();

  allRelatedThesauri.forEach(t => {
    if (t._id) {
      const id = t._id.toString();
      thesauriIdToExistingValues.set(
        id,
        new Set(t.values?.map(v => normalizeThesaurusLabel(v.label)))
      );
      thesauriIdToNewValues.set(id, new Set());
      thesauriIdToNormalizedNewValues.set(id, new Set());
    }
  });

  return { thesauriIdToExistingValues, thesauriIdToNewValues, thesauriIdToNormalizedNewValues };
};

const syncSaveThesauri = async (
  allRelatedThesauri: ThesaurusSchema[],
  thesauriIdToNewValues: Map<string, Set<string>>
) => {
  for (let i = 0; i < allRelatedThesauri.length; i += 1) {
    const thesaurus = allRelatedThesauri[i];
    if (thesaurus?._id) {
      const newValues: { label: string }[] = Array.from(
        thesauriIdToNewValues.get(thesaurus._id.toString()) || []
      ).map(tval => ({ label: tval }));
      if (newValues.length > 0) {
        const thesaurusValues = thesaurus.values || [];
        // eslint-disable-next-line no-await-in-loop
        await thesauri.save({
          ...thesaurus,
          values: thesaurusValues.concat(newValues),
        });
      }
    }
  }
};

const arrangeThesauri = async (
  file: ImportFile,
  template: TemplateSchema,
  languages?: string[],
  stopOnError: boolean = true
) => {
  const thesauriRelatedProperties = template.properties?.filter(p =>
    ['select', 'multiselect'].includes(p.type)
  );

  let nameToThesauriId = createNameToIdMap(thesauriRelatedProperties, languages);

  const allRelatedThesauri = await thesauri.get({
    $in: Array.from(
      new Set(thesauriRelatedProperties?.map(p => p.content?.toString()).filter(t => t))
    ),
  });

  const thesauriValueData = setupIdValueMaps(allRelatedThesauri);

  await csv(await file.readStream(), stopOnError)
    .onRow(async (row: CSVRow, index: number) => {
      if (index === 0) {
        const columnnames = Object.keys(row);
        nameToThesauriId = filterJSObject(nameToThesauriId, columnnames);
      }
      Object.entries(nameToThesauriId).forEach(([name, id]) => {
        const labels = splitMultiselectLabels(row[name]);
        Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
          if (
            normalizedLabel &&
            !thesauriValueData.thesauriIdToExistingValues.get(id)?.has(normalizedLabel) &&
            !thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.has(normalizedLabel)
          ) {
            thesauriValueData.thesauriIdToNewValues.get(id)?.add(originalLabel);
            thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.add(normalizedLabel);
          }
        });
      });
    })
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesauriValueData.thesauriIdToNewValues);
};

export { arrangeThesauri, ArrangeThesauriError };
