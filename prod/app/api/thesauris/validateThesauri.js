"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.validateThesauri = void 0;var _ajv = _interopRequireDefault(require("ajv"));
var _ajvKeywords = _interopRequireDefault(require("ajv-keywords"));
var _dictionariesModel = _interopRequireDefault(require("./dictionariesModel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const ajv = (0, _ajvKeywords.default)((0, _ajv.default)({ allErrors: true }), ['uniqueItemProperties']);

ajv.addKeyword('uniqueName', {
  async: true,
  // eslint-disable-next-line max-params
  validate: async (config, value, propertySchema, property, thesauri) => {
    const [duplicated] = await _dictionariesModel.default.get({
      _id: { $ne: thesauri._id },
      name: new RegExp(`^${thesauri.name}$` || null, 'i') });


    if (duplicated) {
      return false;
    }
    return true;
  } });


const schema = {
  $async: true,
  required: ['name'],
  properties: {
    name: {
      type: 'string',
      uniqueName: '',
      minLength: 1 },

    values: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label'],
        properties: {
          label: {
            type: 'string',
            minLength: 1 } } } } } };







const validateThesauri = ajv.compile(schema);exports.validateThesauri = validateThesauri;