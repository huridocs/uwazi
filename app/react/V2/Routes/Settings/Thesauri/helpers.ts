import { ThesaurusValueSchema } from 'shared/types/thesaurusType';

const mergeValues = (
  oldValues: ThesaurusValueSchema[],
  newValues: ThesaurusValueSchema & { groupId?: string }[]
) => {
  let currentValues = [...oldValues];
  const itemsWithGroups = newValues.filter(item => item.groupId && item.groupId !== '');
  const itemsWithoutGroups = newValues
    .filter(item => !item.groupId || item.groupId === '')
    .map(item => {
      // @ts-ignore
      delete item.id;
      delete item.groupId;
      return item;
    });
  currentValues = currentValues.map(value => {
    const groupItem = itemsWithGroups.find(item => value.id === item.groupId);
    if (groupItem) {
      delete groupItem.groupId;
      // @ts-ignore
      delete groupItem.id;
      value.values?.push(groupItem as ThesaurusValueSchema);
      return value;
    }
    return value;
  });

  return [...currentValues, ...itemsWithoutGroups] as ThesaurusValueSchema[];
};

export { mergeValues };
