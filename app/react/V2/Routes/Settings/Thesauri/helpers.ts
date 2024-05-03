import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { httpRequest } from 'shared/superagent';
import { ClientThesaurusValue } from 'app/apiResponseTypes';

const sanitizeThesaurusValues = (
  thesaurus: ThesaurusSchema,
  values: ClientThesaurusValue[]
): ThesaurusSchema => {
  const sanitizedThesaurus = { ...thesaurus, values };
  sanitizedThesaurus.values =
    values?.map(sValue => {
      // @ts-ignore
      delete sValue.groupId;
      // @ts-ignore
      delete sValue._id;
      if (sValue.values) {
        sValue.values = sValue.values.map((ssValue: any) => {
          delete ssValue._id;
          // @ts-ignore
          delete ssValue.groupId;
          return ssValue;
        });
      }
      return sValue;
    }) || ([] as ThesaurusValueSchema[]);
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

export { sanitizeThesaurusValues, sanitizeThesauri, importThesaurus };
