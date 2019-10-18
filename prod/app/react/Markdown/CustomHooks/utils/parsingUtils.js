"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;function findBucketsByCountry(set, countryKey, key) {
  return set.aggregations.all[countryKey].buckets.
  find(country => country.key === key);
}var _default =

{
  findBucketsByCountry };exports.default = _default;