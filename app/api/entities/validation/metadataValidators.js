import { isNumber, isUndefined, isString, isObject, isNull } from 'util';
import { propertyTypes } from 'shared/propertyTypes';

const validateSingleWrappedValue = validationFn => value => {
  if (value.length !== 1) {
    return !value.length;
  }

  if (value[0].value === null) {
    return true;
  }

  const [{ value: pureValue }] = value;
  return validationFn(pureValue);
};

const isEmpty = value =>
  isNull(value) || isUndefined(value) || !value.length || !value.some(v => v.value);

const isNonArrayObject = value => isObject(value) && !Array.isArray(value);

const validateDateProperty = value => isNumber(value);

const isValidDateRange = value => {
  if (!isNonArrayObject(value)) {
    return false;
  }

  if (validateDateProperty(value.from) && validateDateProperty(value.to)) {
    return value.from <= value.to;
  }

  if (isString(value.from) || isString(value.to)) {
    return false;
  }

  return true;
};

const isValidSelect = value => isString(value);

const isValidGeolocation = value => isNumber(value.lat) && isNumber(value.lon);

const validateRequiredProperty = (property, value) => {
  if (property.required) {
    if (property.type === 'numeric') {
      return (value[0] && value[0].value === 0) || !isEmpty(value);
    }

    return !isEmpty(value);
  }
  return true;
};

const isValidLinkField = value =>
  isString(value.label) && isString(value.url) && ((value.label && value.url) || !value.label);

const validateNumericProperty = value =>
  isNumber(value) || value === '' || (isString(value) && `${parseInt(value, 10)}` === value);

const validateMultiDateProperty = value =>
  Array.isArray(value) && value.every(item => isNumber(item.value) || isNull(item.value));

const validateMultiDateRangeProperty = value =>
  Array.isArray(value) && value.every(item => isValidDateRange(item.value));

const validateGeolocationProperty = value =>
  Array.isArray(value) && value.every(item => isValidGeolocation(item.value));

const validateMultiSelectProperty = value =>
  Array.isArray(value) && value.every(item => isValidSelect(item.value) && item.value);

const validateLuceneBytesLimit = value => {
  const LUCENE_BYTES_LIMIT = 32766;
  const bytes = Buffer.from(JSON.stringify(value));
  return bytes.length < LUCENE_BYTES_LIMIT;
};

export const customErrorMessages = {
  required: 'property is required',
  length_exceeded: 'maximum field length exceeded',
  property_not_allowed: 'property is not configured on the template, it is not allowed',
  relationship_wrong_foreign_id: 'related entities do not exist or belong to another template',
  dictionary_wrong_foreing_id: 'related dictionary value/s does not exists',
  relationship_values_should_match:
    'relationships with the same configuration should have the same values',
  [propertyTypes.date]: 'should be number',
  [propertyTypes.multidate]: 'should be an array of numbers',
  [propertyTypes.daterange]:
    'should be a "{ to: number, from: number }" object, "to" should be greater than "from"',
  [propertyTypes.multidaterange]:
    'should be a "[ { to: number, from: number } ]" collection, "to" should be greater than "from"',
  [propertyTypes.text]: 'should be a string',
  [propertyTypes.markdown]: 'should be a string',
  [propertyTypes.media]: 'should be a string',
  [propertyTypes.image]: 'should be a string',
  [propertyTypes.select]: 'should be string',
  [propertyTypes.multiselect]: 'should be an array of non empty strings',
  [propertyTypes.relationship]: 'should be an array of non empty strings',
  [propertyTypes.numeric]: 'should be number',
  [propertyTypes.link]:
    'should be a "{ label: string, url: string }" object properties can not be blank',
  [propertyTypes.geolocation]:
    'should be a "[ { lat: number, lon: number, label: string } ]" collection, lat and lon are required',
};

export const validators = {
  [propertyTypes.date]: validateSingleWrappedValue(validateDateProperty),
  [propertyTypes.multidate]: validateMultiDateProperty,
  [propertyTypes.daterange]: validateSingleWrappedValue(isValidDateRange),
  [propertyTypes.multidaterange]: validateMultiDateRangeProperty,
  [propertyTypes.text]: validateSingleWrappedValue(isString),
  [propertyTypes.markdown]: validateSingleWrappedValue(isString),
  [propertyTypes.media]: validateSingleWrappedValue(isString),
  [propertyTypes.image]: validateSingleWrappedValue(isString),
  [propertyTypes.select]: validateSingleWrappedValue(isValidSelect),
  [propertyTypes.numeric]: validateSingleWrappedValue(validateNumericProperty),
  [propertyTypes.multiselect]: validateMultiSelectProperty,
  [propertyTypes.relationship]: validateMultiSelectProperty,
  [propertyTypes.link]: validateSingleWrappedValue(isValidLinkField),
  [propertyTypes.geolocation]: validateGeolocationProperty,
  validateRequiredProperty,
  validateLuceneBytesLimit,
};
