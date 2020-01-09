import { isNumber, isUndefined, isString, isObject, isNull } from 'util';
import { templateTypes } from 'shared/templateTypes';

const isEmpty = value =>
  isNull(value) ||
  isUndefined(value) ||
  ((isString(value) || Array.isArray(value)) && !value.length);

const isNonArrayObject = value => isObject(value) && !Array.isArray(value);

const validateDateProperty = value => isNumber(value);

const isValidDateRange = value => {
  if (!isNonArrayObject(value)) {
    return false;
  }
  if (validateDateProperty(value.from) && validateDateProperty(value.to)) {
    return value.from <= value.to;
  }
  return true;
};

const isValidSelect = value => isString(value) && value;

const isValidGeolocation = value =>
  isString(value.label) && isNumber(value.lat) && isNumber(value.lon);

const validateRequiredProperty = (property, value) => {
  if (property.required) {
    return !isEmpty(value);
  }
  return true;
};

const validateTextProperty = value => isString(value);

const validateNumericProperty = value => isNumber(value) || value === '';

const validateMultiDateProperty = value =>
  Array.isArray(value) && value.every(item => validateDateProperty(item) || isNull(item));

const validateDateRangeProperty = value => isValidDateRange(value);

const validateMultiDateRangeProperty = value => value.every(isValidDateRange);

const validateGeolocationProperty = value =>
  Array.isArray(value) && value.every(isValidGeolocation);

const validateMultiSelectProperty = value => Array.isArray(value) && value.every(isValidSelect);

const validateLinkProperty = value =>
  isString(value.label) && value.label && isString(value.url) && value.url;

export const customErrorMessages = {
  required: 'property is required',
  [templateTypes.date]: 'should be number',
  [templateTypes.multidate]: 'should be an array of numbers',
  [templateTypes.daterange]:
    'should be a "{ to: number, from: number }" object, "to" should be greater than "from"',
  [templateTypes.multidaterange]:
    'should be a "[ { to: number, from: number } ]" collection, "to" should be greater than "from"',
  [templateTypes.text]: 'should be a string',
  [templateTypes.markdown]: 'should be a string',
  [templateTypes.media]: 'should be a string',
  [templateTypes.image]: 'should be a string',
  [templateTypes.select]: 'should be string',
  [templateTypes.multiselect]: 'should be an array of non empty strings',
  [templateTypes.relationship]: 'should be an array of non empty strings',
  [templateTypes.numeric]: 'should be number',
  [templateTypes.link]:
    'should be a "{ label: string, url: string }" object properties can not be blank',
  [templateTypes.geolocation]:
    'should be a "[ { lat: number, lon: number, label: string } ]" collection, lat and lon are required',
};

export const validators = {
  [templateTypes.date]: validateDateProperty,
  [templateTypes.multidate]: validateMultiDateProperty,
  [templateTypes.daterange]: validateDateRangeProperty,
  [templateTypes.multidaterange]: validateMultiDateRangeProperty,
  [templateTypes.text]: validateTextProperty,
  [templateTypes.markdown]: validateTextProperty,
  [templateTypes.media]: validateTextProperty,
  [templateTypes.image]: validateTextProperty,
  [templateTypes.select]: validateTextProperty,
  [templateTypes.multiselect]: validateMultiSelectProperty,
  [templateTypes.relationship]: validateMultiSelectProperty,
  [templateTypes.numeric]: validateNumericProperty,
  [templateTypes.link]: validateLinkProperty,
  [templateTypes.geolocation]: validateGeolocationProperty,
  validateRequiredProperty,
};
