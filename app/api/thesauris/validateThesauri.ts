/** @format */

/* eslint-disable max-params */

import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import model from './dictionariesModel';
import schema from './dictionariesSchema';
import { Thesaurus } from './dictionariesType';

const ajv = ajvKeywords(Ajv({ allErrors: true }), ['uniqueItemProperties']);

ajv.addKeyword('uniqueName', {
  async: true,
  validate: async (
    _config: any,
    _value: any,
    _propertySchema: any,
    _property: any,
    thesauri: Thesaurus
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

export const validateThesauri = ajv.compile(schema);
