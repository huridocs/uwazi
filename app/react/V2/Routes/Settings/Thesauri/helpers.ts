import { ThesaurusValueSchema } from 'shared/types/thesaurusType';

const mergeValues = (
  oldValues: ThesaurusValueSchema[],
  newValues: ThesaurusValueSchema & { groupId?: string }[]
) => {
  let currentValues = [...oldValues];
  const itemsWithGroups = newValues.filter(item => item.groupId && item.groupId !== '');
  const itemsWithoutGroups = newValues.filter(item => !item.groupId || item.groupId === '');
  currentValues = currentValues.map(value => {
    const groupItem = itemsWithGroups.find(item => value.id === item.groupId);
    if (groupItem) {
      value.values?.push(groupItem as ThesaurusValueSchema);
      return value;
    }
    return value;
  });

  return [...currentValues, ...itemsWithoutGroups] as ThesaurusValueSchema[];
};

const sanitizeValues = (values: ThesaurusValueSchema & { groupId: string }[]) => {
  const sanitizedValues = values.map(sValue => {
    // @ts-ignore
    delete sValue.id;
    // @ts-ignore
    delete sValue.groupId;
    return sValue;
  });
  // @ts-ignore
  const sanitizedGroupValues = sanitizedValues.values?.map((sgValue: ThesaurusValueSchema) => {
    delete sgValue.id;
    // @ts-ignore
    delete sgValue.groupId;
    return sgValue;
  });
  // @ts-ignore
  sanitizeValues.values = sanitizedGroupValues;
  return sanitizeValues;
};

export { mergeValues, sanitizeValues };
