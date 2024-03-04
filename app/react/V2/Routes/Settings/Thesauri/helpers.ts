import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { LocalThesaurusValueSchema } from './components/ThesauriValueFormSidepanel';
import { httpRequest } from 'shared/superagent';

const mergeValues = (
  oldItems: ThesaurusValueSchema[],
  newItems: LocalThesaurusValueSchema[]
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

function sanitizeThesauri(thesaurus: ThesaurusSchema) {
  const sanitizedThesauri = { ...thesaurus };
  sanitizedThesauri.values = sanitizedThesauri
    .values!.filter((value: ThesaurusValueSchema) => value.label)
    .filter((value: ThesaurusValueSchema) => !value.values || value.values.length)
    .map((value: ThesaurusValueSchema) => {
      const _value = { ...value };
      if (_value.values) {
        _value.values = _value.values.filter(_v => _v.label);
      }
      return _value;
    });
  return sanitizedThesauri;
}

const importThesaurus = async (
  thesaurus: ThesaurusSchema,
  file: File
): Promise<ThesaurusSchema> => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const fields = {
    thesauri: JSON.stringify(thesaurus),
  };

  return (await httpRequest('thesauris', fields, headers, file)) as ThesaurusSchema;
};

export { mergeValues, sanitizeThesaurusValues, sanitizeThesauri, importThesaurus };
