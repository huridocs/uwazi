import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

const mergeByProperty = (a, b, p) => a.filter(aa => !b.find(bb => aa[p] === bb[p])).concat(b);

const checkSelections = (storeSelections: any = [], file: FileType, entity: EntitySchema) => {
  let selections = storeSelections;

  const entityData = {
    title: entity.title,
    ...entity.metadata,
  };

  if (file.extractedMetadata) {
    selections = mergeByProperty(file.extractedMetadata, storeSelections, 'label');
  }

  selections = storeSelections;
  return selections;
};

const saveSelections = async (entity: EntitySchema) => {
  console.log('here goes the extracted metadata validation!');
  console.log(entity);

  // const mainDocument = await api.get(
  //   'files',
  //   new RequestParams({ entity: entity.sharedId, type: 'document' })
  // );

  // const selections = checkSelections(storeSelections, mainDocument.json[0], entity);
  // if (storeSelections.length > 0) {
  //   return api.post(
  //     'files',
  //     new RequestParams({ extractedMetadata: selections, _id: mainDocument.json[0]._id })
  //   );
  // }

  return null;
};

export { saveSelections, checkSelections };
