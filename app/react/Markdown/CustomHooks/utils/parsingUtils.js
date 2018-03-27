function findBucketsByCountry(set, countryKey, key) {
  return set.aggregations.all[countryKey].buckets
  .find(country => country.key === key);
}

export default {
  findBucketsByCountry
};
