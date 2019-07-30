import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import model from './dictionariesModel';

const ajv = ajvKeywords(Ajv({ allErrors: true }), ['uniqueItemProperties']);

ajv.addKeyword('uniqueName', {
  async: true,
  // eslint-disable-next-line max-params
  validate: async (config, value, propertySchema, property, thesauri) => {
    const [duplicated] = await model.get({
      _id: { $ne: thesauri._id },
      name: new RegExp(`^${thesauri.name}$` || null, 'i')
    });

    if (duplicated) {
      return false;
    }
    return true;
  }
});

const schema = {
  $async: true,
  properties: {
    name: {
      type: 'string',
      uniqueName: ''
    },
    values: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label'],
        properties: {
          label: {
            type: 'string',
            minLength: 1,
          }
        }
      },
      uniqueItemProperties: ['label']
    }
  }
};

const validateThesauri = ajv.compile(schema);

export {
  // eslint-disable-next-line import/prefer-default-export
  validateThesauri
};
