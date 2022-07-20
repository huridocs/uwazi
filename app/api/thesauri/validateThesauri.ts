import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { wrapValidator } from 'shared/tsUtils';
import { thesaurusSchema } from 'shared/types/thesaurusSchema';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import model from './dictionariesModel';

const ajv = ajvKeywords(new Ajv({ allErrors: true }), ['uniqueItemProperties']);
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'uniqueName',
  async: true,
  validate: async (_config: any, thesaurus: ThesaurusSchema) => {
    const [duplicated] = await model.get({
      _id: { $ne: thesaurus._id },
      name: new RegExp(`^${thesaurus.name}$` || '', 'i'),
    });

    if (duplicated) {
      return false;
    }
    return true;
  },
});

const validateUniqeLabels = (values: { label: string }[] | undefined): boolean => {
  if (!values) return true;
  const asSet = new Set(values.map(v => v.label));
  return values.length === asSet.size;
};

ajv.addKeyword({
  keyword: 'uniqueLabels',
  async: true,
  validate: async (_config: any, thesaurus: ThesaurusSchema) =>
    !thesaurus.values ||
    (validateUniqeLabels(thesaurus.values) &&
      thesaurus.values.every(v => validateUniqeLabels(v.values))),
});

export const validateThesauri = wrapValidator(ajv.compile(thesaurusSchema));
