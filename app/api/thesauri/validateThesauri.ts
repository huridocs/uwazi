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

const getDuplicatedLabels = (values: { label: string }[] | undefined): string[] => {
  if (!values) return [];
  const labels = values.map(v => v.label);
  const asSet: Set<string> = new Set();
  const duplicated: string[] = [];
  labels.forEach(label => {
    if (asSet.has(label)) {
      duplicated.push(label);
    }
    asSet.add(label);
  });
  return duplicated;
};

ajv.addKeyword({
  keyword: 'uniqueLabels',
  validate: (_config: any, thesaurus: ThesaurusSchema) => {
    const duplicated = getDuplicatedLabels(thesaurus.values);
    thesaurus.values?.forEach(v => {
      duplicated.push(...getDuplicatedLabels(v.values).map(l => `${v.label}/${l}`));
    });
    if (duplicated.length > 0) {
      throw new Ajv.ValidationError([
        {
          instancePath: '',
          schemaPath: '#/uniqueLabels',
          keyword: 'uniqueLabels',
          params: {
            duplicated,
          },
          message: `Duplicated labels: ${duplicated.join(', ')}.`,
        },
      ]);
    }
    return true;
  },
});

export const validateThesauri = wrapValidator(ajv.compile(thesaurusSchema));
