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

  // eslint-disable-next-line max-statements
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

  return thesaurus.update({
    name: thesaurus.name,
    values: nextValues,
  });
};

const getThesaurusSchemaById = async (thesauriDS: ThesauriDataSource, thesaurusId: string) =>
  toSchema((await thesauriDS.getById(thesaurusId)).getDataOrThrow());

const getThesaurusById = async (thesauriDS: ThesauriDataSource, thesaurusId: string) =>
  (await thesauriDS.getById(thesaurusId)).getDataOrThrow();

export { getThesaurusSchemaById, getThesaurusById, appendValuesToThesaurus, toSchema };
