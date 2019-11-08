/** @format */

/* eslint-disable max-params */

import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { wrapValidator } from 'shared/tsUtils';
import model from './dictionariesModel';
import { thesaurusSchema } from './dictionariesSchema';
import { ThesaurusSchema } from './dictionariesType';

const ajv = ajvKeywords(Ajv({ allErrors: true }), ['uniqueItemProperties']);

ajv.addKeyword('uniqueName', {
  async: true,
  validate: async (
    _config: any,
    _value: any,
    _propertySchema: any,
    _property: any,
    thesauri: ThesaurusSchema
  ) => {
    const [duplicated] = await model.get({
      _id: { $ne: thesauri._id },
      name: new RegExp(`^${thesauri.name}$` || '', 'i'),
    });

    if (duplicated) {
      return false;
    }
    return true;
  },
});

export const validateThesauri = wrapValidator(ajv.compile(thesaurusSchema));
