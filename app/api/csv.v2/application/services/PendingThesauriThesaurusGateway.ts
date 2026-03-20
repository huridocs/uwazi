import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Thesaurus, ThesaurusValue } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Id } from '#api/core/libs/Id.js';
import { ThesaurusValueInput } from './CsvThesauriValuesDiff.js';

const mapValuesToSchema = (values: ThesaurusValue[] | undefined): ThesaurusSchema['values'] =>
  values?.map(value => ({
    id: value.id,
    label: value.label,
    values: value.values?.map(nested => ({
      id: nested.id,
      label: nested.label,
    })),
  }));

const toSchema = (thesaurus: Thesaurus): ThesaurusSchema => ({
  _id: thesaurus.id,
  name: thesaurus.name,
  values: mapValuesToSchema(thesaurus.values),
});

const addIds = (children: Array<{ label: string }> | undefined) =>
  children?.map(child => ({
    id: new Id({}).value,
    label: child.label,
  }));

const appendValuesToThesaurus = (thesaurus: Thesaurus, valuesToAppend: ThesaurusValueInput[]) => {
  const nextValues = structuredClone(thesaurus.values);

  valuesToAppend.forEach(rootToAppend => {
    const existingRoot = nextValues.find(value => value.label === rootToAppend.label);

    if (!existingRoot) {
      nextValues.push({
        id: new Id({}).value,
        label: rootToAppend.label,
        values: addIds(rootToAppend.values),
      });
      return;
    }

    if (!rootToAppend.values?.length) {
      return;
    }

    const existingChildren = existingRoot.values ?? [];
    const existingLabels = new Set(existingChildren.map(child => child.label));
    const childrenToAdd = rootToAppend.values
      .filter(child => !existingLabels.has(child.label))
      .map(child => ({
        id: new Id({}).value,
        label: child.label,
      }));

    if (!childrenToAdd.length) {
      return;
    }

    existingRoot.values = [...existingChildren, ...childrenToAdd];
  });

  return new Thesaurus({
    id: thesaurus.id,
    name: thesaurus.name,
    values: nextValues,
  });
};

const getThesaurusSchemaById = async (thesauriDS: ThesauriDataSource, thesaurusId: string) =>
  toSchema((await thesauriDS.getById(thesaurusId)).getDataOrThrow());

const appendAndPersistThesaurusValues = async (
  thesauriDS: ThesauriDataSource,
  thesaurusId: string,
  valuesToAppend: ThesaurusValueInput[]
) => {
  const current = (await thesauriDS.getById(thesaurusId)).getDataOrThrow();
  if (!valuesToAppend.length) {
    return toSchema(current);
  }

  const updated = appendValuesToThesaurus(current, valuesToAppend);
  await thesauriDS.update(updated);
  return toSchema(updated);
};

export { getThesaurusSchemaById, appendAndPersistThesaurusValues };
