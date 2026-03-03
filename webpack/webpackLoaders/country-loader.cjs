const { readFileSync } = require('fs');
const { join } = require('path');

const countries = JSON.parse(readFileSync(join(__dirname, '../../node_modules/world-countries/countries.json'), 'utf8'));

module.exports = function countryLoader() {
  const processed = countries.map(country => ({
    cca3: country.cca3,
    name: { common: country.name.common },
    cca2: country.cca2,
  }));

  return `export default ${JSON.stringify(processed)}`;
};
