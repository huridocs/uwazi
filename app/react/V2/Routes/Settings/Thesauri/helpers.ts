import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';

const mergeValues = (
  oldItems: ThesaurusValueSchema[],
  newItems: ThesaurusValueSchema & { groupId?: string }[]
): ThesaurusValueSchema[] => {
  const itemsWithGroups = newItems.filter(item => item.groupId && item.groupId !== '');
  const itemsWithoutGroups = newItems
    .filter(item => !item.groupId || item.groupId === '')
    .map(item => {
      delete item.groupId;
      return item;
    });
  oldItems = oldItems.map(value => {
    const groupItem = itemsWithGroups.find(item => value.id === item.groupId);
    if (groupItem) {
      delete groupItem.groupId;
      value.values?.push(groupItem as ThesaurusValueSchema);
      return value;
    }
    return value;
  });

  return [...oldItems, ...itemsWithoutGroups] as ThesaurusValueSchema[];
};

const sanitizeThesaurusValues = (
  thesaurus: ThesaurusSchema,
  values: ThesaurusValueSchema[]
): ThesaurusSchema => {
  const sanitizedThesaurus = { ...thesaurus, values };
  sanitizedThesaurus.values = values.map(sValue => {
    delete sValue.id;
    // @ts-ignore
    delete sValue.groupId;
    if (sValue.values) {
      sValue.values = sValue.values.map(ssValue => {
        delete ssValue.id;
        // @ts-ignore
        delete ssValue.groupId;
        return ssValue;
      });
    }
    return sValue;
  }) as ThesaurusValueSchema[];
  return sanitizedThesaurus;
};

export { mergeValues, sanitizeThesaurusValues };
