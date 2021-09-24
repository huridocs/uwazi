import { ImportFile } from 'api/csv/importFile';
import thesauri from 'api/thesauri';
import { propertyTypes } from 'shared/propertyTypes';
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

const separateSelectAndMultiselectThesauri = (
  thesauriRelatedProperties: PropertySchema[] | undefined,
  languages?: string[]
): [{ [k: string]: string }, { [k: string]: string }] => {
  const nameToThesauriIdSelects: { [k: string]: string } = {};
  const nameToThesauriIdMultiselects: { [k: string]: string } = {};

  thesauriRelatedProperties?.forEach(p => {
    if (p.content && p.type) {
      const thesarusID = p.content.toString();
      if (p.type === propertyTypes.select) {
        nameToThesauriIdSelects[p.name] = thesarusID;
        languages?.forEach(suffix => {
          nameToThesauriIdSelects[`${p.name}__${suffix}`] = thesarusID;
        });
      } else if (p.type === propertyTypes.multiselect) {
        nameToThesauriIdMultiselects[p.name] = thesarusID;
        languages?.forEach(suffix => {
          nameToThesauriIdMultiselects[`${p.name}__${suffix}`] = thesarusID;
        });
      }
    }
  });

  return [nameToThesauriIdSelects, nameToThesauriIdMultiselects];
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

const handleLabels = (
  id: string,
  original: string,
  normalized: string | null,
  thesauriValueData: ThesauriValueData
) => {
  if (
    normalized &&
    !thesauriValueData.thesauriIdToExistingValues.get(id)?.has(normalized) &&
    !thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.has(normalized)
  ) {
    thesauriValueData.thesauriIdToNewValues.get(id)?.add(original);
    thesauriValueData.thesauriIdToNormalizedNewValues.get(id)?.add(normalized);
  }
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

  let [
    nameToThesauriIdSelects,
    nameToThesauriIdMultiselects,
  ] = separateSelectAndMultiselectThesauri(thesauriRelatedProperties, languages);

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
        nameToThesauriIdSelects = filterJSObject(nameToThesauriIdSelects, columnnames);
        nameToThesauriIdMultiselects = filterJSObject(nameToThesauriIdMultiselects, columnnames);
      }
      Object.entries(nameToThesauriIdSelects).forEach(([name, id]) => {
        const label = row[name];
        if (label) {
          const normalizedLabel = normalizeThesaurusLabel(label);
          handleLabels(id, label, normalizedLabel, thesauriValueData);
        }
      });
      Object.entries(nameToThesauriIdMultiselects).forEach(([name, id]) => {
        const labels = splitMultiselectLabels(row[name]);
        if (labels) {
          Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
            handleLabels(id, originalLabel, normalizedLabel, thesauriValueData);
          });
        }
      });
    })
    .onError(async (e: Error, row: CSVRow, index: number) => {
      throw new ArrangeThesauriError(e, row, index);
    })
    .read();

  await syncSaveThesauri(allRelatedThesauri, thesauriValueData.thesauriIdToNewValues);
};

export { arrangeThesauri, ArrangeThesauriError };
