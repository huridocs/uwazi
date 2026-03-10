import countries from 'world-countries';

const CountryList = new Map(
  countries.map(obj => [obj.cca3, { cca2: obj.cca2, label: obj.name.common, cca3: obj.cca3 }])
);

export default CountryList;
